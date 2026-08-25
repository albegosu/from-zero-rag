import { getOllamaRuntime } from '~/server/utils/ollama'
import { requireSessionUserId } from '~/server/utils/session'
import { logger } from '~/server/utils/logger'

interface ListedModel {
  id: string
  name: string
  provider: string
  description?: string
}

export default defineEventHandler(async (event) => {
  requireSessionUserId(event)

  const { host, apiKey, isCloud, defaultModel } = getOllamaRuntime()
  const provider = isCloud ? 'Ollama Cloud' : 'Ollama'
  const headers: Record<string, string> = {}
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const models: ListedModel[] = []

  try {
    const tags = await $fetch<{ models?: Array<{ name?: string; details?: { parameter_size?: string } }> }>(
      `${host}/api/tags`,
      { headers },
    )
    for (const m of tags.models ?? []) {
      if (!m.name) continue
      models.push({
        id: m.name,
        name: m.name,
        provider,
        description: m.details?.parameter_size,
      })
    }
  }
  catch (err) {
    logger.warn('ollama /api/tags failed, trying /v1/models', {
      message: err instanceof Error ? err.message : String(err),
    })
    try {
      const openai = await $fetch<{ data?: Array<{ id?: string }> }>(`${host}/v1/models`, { headers })
      for (const m of openai.data ?? []) {
        if (!m.id) continue
        models.push({ id: m.id, name: m.id, provider })
      }
    }
    catch (fallbackErr) {
      logger.warn('ollama /v1/models failed', {
        message: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
      })
    }
  }

  if (!models.some(m => m.id === defaultModel)) {
    models.unshift({
      id: defaultModel,
      name: defaultModel,
      provider,
      description: 'configured default',
    })
  }

  return { defaultModel, models }
})
