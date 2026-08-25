import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { logger } from '~/server/utils/logger'
import { classifyLlmError } from '~/utils/llm-errors'
import {
  AGENT_SYSTEM_PROMPT,
  buildAgentUserMessage,
  dialogueFromEvents,
  parseAgentResponse,
} from '~/server/utils/embryo-agent'

function createOllamaChatModel() {
  const config = useRuntimeConfig()
  const provider = String(config.llmProvider || '')
  const configuredUrl = String(config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '')
  const isCloud = provider === 'ollama-cloud' || configuredUrl.includes('ollama.com')
  const host = isCloud
    ? (configuredUrl.includes('ollama.com') ? configuredUrl : 'https://ollama.com')
    : configuredUrl
  const apiKey = String(config.ollamaApiKey || '')

  if (isCloud && !apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'OLLAMA_API_KEY is required for Ollama Cloud',
    })
  }

  const ollama = createOpenAI({
    baseURL: `${host}/v1`,
    apiKey: apiKey || 'ollama',
    name: 'ollama',
  })

  return {
    model: ollama.chat(config.ollamaLlmModel || 'llama3.2'),
    timeoutMs: Number(config.ollamaChatTimeoutMs) || 180_000,
  }
}

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!

  const embryo = await prisma.embryo.findFirst({
    where: { id, userId },
    include: {
      tensions: { where: { resolved: false } },
      events: { orderBy: { createdAt: 'asc' } },
      connections: { select: { targetId: true } },
    },
  })

  if (!embryo) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }
  if (embryo.state === 'FOSSIL') {
    throw createError({ statusCode: 409, statusMessage: 'Fossils cannot receive agent input' })
  }

  const otherEmbryos = await prisma.embryo.findMany({
    where: { userId, id: { not: id }, state: { not: 'FOSSIL' } },
    select: { id: true, seed: true, state: true },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  const alreadyConnected = new Set(embryo.connections.map(c => c.targetId))
  const candidates = otherEmbryos.filter(e => !alreadyConnected.has(e.id))
  const dialogue = dialogueFromEvents(embryo.events).slice(-12)

  const userMessage = buildAgentUserMessage({
    seed: embryo.seed,
    state: embryo.state,
    openTensions: embryo.tensions.map(t => t.question),
    otherEmbryos: candidates,
    dialogue,
  })

  const { model, timeoutMs } = createOllamaChatModel()

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  let fullText = ''

  try {
    const result = streamText({
      model,
      system: AGENT_SYSTEM_PROMPT,
      prompt: userMessage,
      abortSignal: AbortSignal.timeout(timeoutMs),
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullText += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`))
          }

          const parsed = parseAgentResponse(fullText)

          if (!parsed.question) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Agent returned empty response' })}\n\n`))
            controller.close()
            return
          }

          const dbOps: any[] = [
            prisma.agentNote.create({
              data: {
                embryoId: id,
                type: 'PENDING_QUESTION',
                content: parsed.question,
              },
            }),
            prisma.embryoEvent.create({
              data: {
                embryoId: id,
                type: 'AGENT_QUESTION',
                initiatedBy: 'AGENT',
                payload: { question: parsed.question },
              },
            }),
          ]

          if (embryo.state === 'LATENT') {
            dbOps.push(
              prisma.embryo.update({
                where: { id },
                data: {
                  state: 'GERMINATING',
                  events: {
                    create: {
                      type: 'STATE_CHANGED',
                      initiatedBy: 'AGENT',
                      payload: { from: 'LATENT', to: 'GERMINATING' },
                    },
                  },
                },
              }),
            )
          }

          const validTargetIds = new Set(candidates.map(e => e.id))
          const validConnections = parsed.connections.filter(c => validTargetIds.has(c.targetId))

          for (const conn of validConnections) {
            dbOps.push(
              prisma.agentNote.create({
                data: {
                  embryoId: id,
                  type: 'PENDING_CONNECTION',
                  content: `${conn.type} [${conn.targetId}]: ${conn.reason}`,
                },
              }),
            )
          }

          await prisma.$transaction(dbOps)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            question: parsed.question,
            connections: validConnections,
          })}\n\n`))
          controller.close()
        }
        catch (err) {
          const classified = classifyLlmError(err)
          logger.error('embryo agent stream failed', {
            embryoId: id,
            statusCode: classified.statusCode,
            kind: classified.kind,
          })
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: classified.kind === 'unauthorized' || /unauthorized/i.test(classified.rawMessage)
              ? 'Ollama Cloud rejected the request. Check OLLAMA_API_KEY.'
              : classified.rawMessage.slice(0, 280) || 'Agent unavailable',
          })}\n\n`))
          controller.close()
        }
      },
    })

    return sendStream(event, stream)
  }
  catch (err) {
    const classified = classifyLlmError(err)
    logger.error('embryo agent generate failed', {
      embryoId: id,
      statusCode: classified.statusCode,
      kind: classified.kind,
    })
    throw createError({
      statusCode: classified.statusCode,
      statusMessage: classified.rawMessage.slice(0, 280) || 'Agent unavailable',
    })
  }
})
