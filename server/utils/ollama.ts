import { createOpenAI } from '@ai-sdk/openai'
import { sanitizeModelId } from '~/utils/llm-model'

export { sanitizeModelId }

export function getOllamaRuntime() {
  const config = useRuntimeConfig()
  const provider = String(config.llmProvider || '')
  const configuredUrl = String(config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '')
  const isCloud = provider === 'ollama-cloud' || configuredUrl.includes('ollama.com')
  const host = isCloud
    ? (configuredUrl.includes('ollama.com') ? configuredUrl : 'https://ollama.com')
    : configuredUrl
  const apiKey = String(config.ollamaApiKey || '')
  const defaultModel = String(config.ollamaLlmModel || 'llama3.2')
  const timeoutMs = Number(config.ollamaChatTimeoutMs) || 180_000

  if (isCloud && !apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'OLLAMA_API_KEY is required for Ollama Cloud',
    })
  }

  return { host, apiKey, isCloud, defaultModel, timeoutMs, provider }
}

export function createOllamaChatModel(modelId?: string) {
  const { host, apiKey, defaultModel, timeoutMs } = getOllamaRuntime()
  const ollama = createOpenAI({
    baseURL: `${host}/v1`,
    apiKey: apiKey || 'ollama',
    name: 'ollama',
  })
  const id = sanitizeModelId(modelId) || defaultModel
  return {
    model: ollama.chat(id),
    timeoutMs,
    modelId: id,
  }
}
