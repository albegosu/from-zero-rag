const MODEL_COOKIE = 'hypar-llm-model'

export function useLlmModel() {
  const cookie = useCookie<string | null>(MODEL_COOKIE, {
    default: () => null,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const runtimeDefault = computed(() => {
    const v = useRuntimeConfig().public.ollamaLlmModel
    return typeof v === 'string' && v.trim() ? v.trim() : 'llama3.2'
  })

  const selectedModel = computed({
    get: () => cookie.value?.trim() || runtimeDefault.value,
    set: (value: string) => {
      cookie.value = value.trim() || null
    },
  })

  return { selectedModel, runtimeDefault }
}
