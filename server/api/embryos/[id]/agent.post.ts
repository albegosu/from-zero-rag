import { streamText } from 'ai'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { logger } from '~/server/utils/logger'
import { createOllamaChatModel } from '~/server/utils/ollama'
import { classifyLlmError } from '~/utils/llm-errors'
import {
  buildAgentSystemPrompt,
  buildAgentUserMessage,
  dialogueFromEvents,
  parseAgentResponse,
} from '~/server/utils/embryo-agent'
import { formatFossilNote } from '~/utils/embryo-method'

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

  let requestedModel: string | undefined
  try {
    const body = await readBody<{ model?: string }>(event)
    requestedModel = body?.model
  }
  catch {
    requestedModel = undefined
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

  const { model, timeoutMs } = createOllamaChatModel(requestedModel)

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  let fullText = ''

  try {
    const result = streamText({
      model,
      system: buildAgentSystemPrompt(embryo.state),
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
                payload: { question: parsed.question, move: parsed.move },
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

          const paths = embryo.state === 'GROWING' ? parsed.paths : []
          for (const path of paths) {
            dbOps.push(
              prisma.agentNote.create({
                data: {
                  embryoId: id,
                  type: 'PENDING_PATH',
                  content: path,
                },
              }),
            )
          }
          if (paths.length > 0) {
            dbOps.push(
              prisma.embryoEvent.create({
                data: {
                  embryoId: id,
                  type: 'AGENT_SUGGESTION',
                  initiatedBy: 'AGENT',
                  payload: { kind: 'paths', paths },
                },
              }),
            )
          }

          const fossil = embryo.state === 'MATURE' ? parsed.fossil : null
          if (fossil) {
            dbOps.push(
              prisma.agentNote.create({
                data: {
                  embryoId: id,
                  type: 'PENDING_FOSSIL',
                  content: formatFossilNote(fossil.kind, fossil.reason),
                },
              }),
            )
            dbOps.push(
              prisma.embryoEvent.create({
                data: {
                  embryoId: id,
                  type: 'FOSSIL_PROPOSED',
                  initiatedBy: 'AGENT',
                  payload: { kind: fossil.kind, reason: fossil.reason },
                },
              }),
            )
          }

          await prisma.$transaction(dbOps)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            question: parsed.question,
            move: parsed.move,
            connections: validConnections,
            paths,
            fossil,
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
