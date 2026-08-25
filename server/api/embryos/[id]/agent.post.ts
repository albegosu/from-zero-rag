import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

const SYSTEM_PROMPT = `You are a collaborator, not an assistant. Your role is to push ideas forward, not to validate them.

You are given an embryo: a raw, unfinished thought captured by the user. Your job is to ask ONE question that challenges, extends, or destabilizes it — something that makes the idea harder to ignore or easier to kill.

Rules:
- Ask exactly one question. No preamble, no explanation.
- Be direct. No filler like "That's interesting" or "Great thought".
- The question should create productive tension, not comfort.
- If the idea has obvious blind spots, surface them.
- If the idea contradicts something implicit, name it.
- Never summarize what the user already said.`

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!

  const embryo = await prisma.embryo.findFirst({
    where: { id, userId },
    include: {
      tensions: { where: { resolved: false } },
      events: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })

  if (!embryo) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }
  if (embryo.state === 'FOSSIL') {
    throw createError({ statusCode: 409, statusMessage: 'Fossils cannot receive agent input' })
  }

  const config = useRuntimeConfig()
  // Ollama exposes an OpenAI-compatible API at /v1
  const ollama = createOpenAI({
    baseURL: `${config.ollamaUrl}/v1`,
    apiKey: 'ollama',
  })
  const model = ollama(config.ollamaLlmModel || 'llama3.2')

  const openTensions = embryo.tensions.map(t => `- ${t.question}`).join('\n')
  const userMessage = [
    `Embryo: ${embryo.seed}`,
    embryo.state !== 'LATENT' ? `Current state: ${embryo.state}` : '',
    openTensions ? `Open tensions:\n${openTensions}` : '',
  ].filter(Boolean).join('\n\n')

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userMessage,
  })

  const question = text.trim()

  const [note] = await prisma.$transaction([
    prisma.agentNote.create({
      data: {
        embryoId: id,
        type: 'PENDING_QUESTION',
        content: question,
      },
    }),
    prisma.embryoEvent.create({
      data: {
        embryoId: id,
        type: 'AGENT_QUESTION',
        initiatedBy: 'AGENT',
        payload: { question },
      },
    }),
  ])

  return { question, noteId: note.id }
})
