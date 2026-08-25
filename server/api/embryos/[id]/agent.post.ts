import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { logger } from '~/server/utils/logger'
import { classifyLlmError } from '~/utils/llm-errors'

const SYSTEM_PROMPT = `You are a collaborator, not an assistant. Your role is to push ideas forward, not to validate them.

You are given an embryo: a raw, unfinished thought captured by the user. Your job is to ask ONE question that challenges, extends, or destabilizes it — something that makes the idea harder to ignore or easier to kill.

Rules:
- Ask exactly one question. No preamble, no explanation.
- Be direct. No filler like "That's interesting" or "Great thought".
- The question should create productive tension, not comfort.
- If the idea has obvious blind spots, surface them.
- If the idea contradicts something implicit, name it.
- Never summarize what the user already said.`

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
      events: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })

  if (!embryo) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }
  if (embryo.state === 'FOSSIL') {
    throw createError({ statusCode: 409, statusMessage: 'Fossils cannot receive agent input' })
  }

  const openTensions = embryo.tensions.map(t => `- ${t.question}`).join('\n')
  const userMessage = [
    `Embryo: ${embryo.seed}`,
    embryo.state !== 'LATENT' ? `Current state: ${embryo.state}` : '',
    openTensions ? `Open tensions:\n${openTensions}` : '',
  ].filter(Boolean).join('\n\n')

  const { model, timeoutMs } = createOllamaChatModel()

  let question: string
  try {
    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userMessage,
      abortSignal: AbortSignal.timeout(timeoutMs),
    })
    question = text.trim()
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
      statusMessage: classified.kind === 'unauthorized' || /unauthorized/i.test(classified.rawMessage)
        ? 'Ollama Cloud rejected the request. Check OLLAMA_API_KEY and that cloud models hit https://ollama.com, not localhost.'
        : classified.rawMessage.slice(0, 280) || 'Agent unavailable',
    })
  }

  if (!question) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Agent returned an empty question. Try again, or switch OLLAMA_LLM_MODEL.',
    })
  }

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
