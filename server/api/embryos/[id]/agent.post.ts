import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { logger } from '~/server/utils/logger'
import { classifyLlmError } from '~/utils/llm-errors'

const SYSTEM_PROMPT = `You are a collaborator, not an assistant. Your role is to push ideas forward, not to validate them.

You are given an embryo: a raw, unfinished thought captured by the user. You also see the user's other embryos for context.

Respond with a JSON object (no markdown fences, no preamble) with these fields:
- "question": exactly ONE question that challenges, extends, or destabilizes the idea. Be direct — no filler.
- "connections": an array of objects with "targetId", "type" (REINFORCES | CONTRADICTS | EXTENDS), and "reason" (one sentence). Only include if you see a genuine link to another embryo. Empty array if none.

Rules:
- The question should create productive tension, not comfort.
- If the idea has obvious blind spots, surface them.
- If the idea contradicts something implicit, name it.
- Never summarize what the user already said.
- For connections, only suggest links that are non-obvious or that the user might miss.
- Keep "reason" under 20 words.`

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

interface AgentResponse {
  question: string
  connections: Array<{ targetId: string; type: string; reason: string }>
}

function parseAgentResponse(text: string): AgentResponse {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      question: String(parsed.question || '').trim(),
      connections: Array.isArray(parsed.connections)
        ? parsed.connections
            .filter((c: any) => c.targetId && c.type && c.reason)
            .map((c: any) => ({
              targetId: String(c.targetId),
              type: ['REINFORCES', 'CONTRADICTS', 'EXTENDS'].includes(c.type) ? c.type : 'EXTENDS',
              reason: String(c.reason).slice(0, 200),
            }))
        : [],
    }
  }
  catch {
    return { question: text.trim(), connections: [] }
  }
}

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!

  const embryo = await prisma.embryo.findFirst({
    where: { id, userId },
    include: {
      tensions: { where: { resolved: false } },
      events: { orderBy: { createdAt: 'desc' }, take: 10 },
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

  const openTensions = embryo.tensions.map(t => `- ${t.question}`).join('\n')
  const otherEmbryosList = candidates.length > 0
    ? candidates.map(e => `- [${e.id}] ${e.seed} (${e.state})`).join('\n')
    : ''

  const userMessage = [
    `Embryo: ${embryo.seed}`,
    embryo.state !== 'LATENT' ? `Current state: ${embryo.state}` : '',
    openTensions ? `Open tensions:\n${openTensions}` : '',
    otherEmbryosList ? `Other embryos in the garden:\n${otherEmbryosList}` : '',
  ].filter(Boolean).join('\n\n')

  const { model, timeoutMs } = createOllamaChatModel()

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  let fullText = ''

  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
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
