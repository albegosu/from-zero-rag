import { useI18n } from 'vue-i18n'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, APICallError, type UIMessage } from 'ai'
import type { AiSuggestion as AiSuggestionItem } from '#ai-elements/types'
import type { SearchParamsConfig } from '~/composables/useSearchParams'
import { fetchLlmModels, getPersistedModel, persistModel, type LlmModelsConfig } from '~/composables/useLlmModels'
import { classifyLlmError } from '~/utils/llm-errors'
import type { ChatMessageMetadata } from '~/composables/useHyparChatDisplay'

export type SearchMode = 'auto' | 'search' | 'direct'

export interface ConversationSummary {
  id: string
  title: string | null
  updatedAt: string
  messageCount: number
}

const SESSION_KEY = 'rag-ui:chatMessages:v2'
const CONV_ID_KEY = 'rag-ui:conversationId'
const SEARCH_MODE_KEY = 'rag-ui:searchMode'
const PROVIDER_QUOTA_KEY = 'rag-ui:providerQuotaAt'

export function useHyparChat() {
  const { t } = useI18n()
  const store = useDocumentsStore()

  const input = ref('')
  const lastSentInput = ref('')
  const scrollRef = ref<HTMLElement | null>(null)
  const expandedSet = reactive(new Set<number>())
  const conversationLoading = ref(false)

  const conversationId = ref<string | null>(null)
  const conversations = ref<ConversationSummary[]>([])

  const llmConfig = ref<LlmModelsConfig | null>(null)
  const selectedModel = ref('')
  const selectedSearchMode = ref<SearchMode>('auto')

  const userMsgMeta = reactive(new Map<string, { searchMode: string; docsCount: number; charCount: number }>())

  const chat = new Chat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        conversationId: conversationId.value || undefined,
        model: selectedModel.value || undefined,
        searchMode: selectedSearchMode.value !== 'auto' ? selectedSearchMode.value : undefined,
      }),
    }),
  })

  const searchParams = ref<SearchParamsConfig | null>(null)
  const dismissedError = ref<unknown>(null)

  const isBusy = computed(() => chat.status === 'submitted' || chat.status === 'streaming')
  const isWaiting = computed(() => {
    if (chat.status !== 'submitted' && chat.status !== 'streaming') return false
    const last = chat.messages[chat.messages.length - 1]
    if (!last || last.role !== 'assistant') return true
    const hasText = last.parts.some((p) => p.type === 'text' && (p as { text: string }).text.length)
    return !hasText
  })
  const isSearching = computed(() => {
    if (!isBusy.value) return false
    const last = chat.messages[chat.messages.length - 1]
    if (!last || last.role !== 'assistant') return false
    return last.parts.some(
      (p) =>
        p.type === 'tool-searchKnowledgeBase'
        && 'state' in p
        && (p as { state: string }).state !== 'output-available',
    )
  })

  const classifiedChatError = computed(() => {
    const err = chat.error
    return err ? classifyLlmError(err) : null
  })
  const visibleChatError = computed(() => chat.error && chat.error !== dismissedError.value)
  const isAppRateLimitError = computed(() => classifiedChatError.value?.kind === 'app_rate_limit')
  const isProviderQuotaError = computed(() => classifiedChatError.value?.kind === 'provider_quota')

  const chatErrorMessage = computed(() => {
    const classified = classifiedChatError.value
    if (!classified) return ''
    switch (classified.kind) {
      case 'app_rate_limit':
        return t('chat.errorAppRateLimit')
      case 'provider_quota':
        if (classified.retryAfterSeconds != null) {
          return t('chat.errorProviderQuota', { seconds: classified.retryAfterSeconds })
        }
        return t('chat.errorProviderQuotaNoWait')
      case 'unauthorized':
        return t('chat.errorUnauthorized')
      case 'unreachable':
        return t('chat.errorUnreachable')
      case 'model':
        if (APICallError.isInstance(chat.error)) {
          return `${t('chat.errorModel')} (${chat.error.statusCode}): ${chat.error.message}`
        }
        return classified.rawMessage || t('chat.errorGeneric')
      default:
        return classified.rawMessage || t('chat.errorGeneric')
    }
  })

  const { displayMessages } = useHyparChatDisplay({
    messages: computed(() => chat.messages),
    chatStatus: computed(() => chat.status),
    userMsgMeta,
    selectedSearchMode,
    docsCount: computed(() => store.documents.length),
    noModelReplyLabel: computed(() => t('chat.noModelReply')),
    untitledLabel: computed(() => t('chat.untitled')),
  })

  const emptySuggestions = computed<AiSuggestionItem[]>(() => [
    { id: 'upload', label: t('chat.uploadCta'), value: '/upload' },
    { id: 'help', label: '/help', value: '/help' },
  ])

  const commandHelp = computed(() => [
    { name: '/remember', description: t('chat.commands.remember'), hasArgs: true },
    { name: '/forget', description: t('chat.commands.forget'), hasArgs: true },
    { name: '/search', description: t('chat.commands.search'), hasArgs: true },
    { name: '/list', description: t('chat.commands.list'), hasArgs: false },
    { name: '/new', description: t('chat.commands.new'), hasArgs: false },
    { name: '/memory clear', description: t('chat.commands.memoryClear'), hasArgs: false },
    { name: '/help', description: t('chat.commands.help'), hasArgs: false },
  ])

  const selectedCommandIdx = ref(-1)
  watch(input, () => { selectedCommandIdx.value = -1 })

  const showCommandHelp = computed(() => input.value.trim().startsWith('/'))
  const filteredCommands = computed(() => {
    const text = input.value.trim()
    if (!text.startsWith('/')) return commandHelp.value
    const lower = text.toLowerCase()
    return commandHelp.value.filter((c) => c.name.toLowerCase().startsWith(lower))
  })

  const llmModelOptions = computed(() => {
    if (!llmConfig.value) return []
    return llmConfig.value.models.map((m) => ({
      id: m.value,
      name: m.value,
      provider: llmConfig.value!.provider,
    }))
  })

  const conversationThreads = computed(() =>
    (conversations.value ?? []).map((c) => ({
      id: c.id,
      title: c.title || t('chat.untitled'),
      updatedAt: c.updatedAt,
      messageCount: c.messageCount,
      active: c.id === conversationId.value,
    })),
  )

  async function ensureConversationId(): Promise<string> {
    if (conversationId.value) return conversationId.value
    const { id } = await $fetch<{ id: string }>('/api/conversations', {
      method: 'POST',
      body: {},
    })
    conversationId.value = id
    if (typeof window !== 'undefined') window.sessionStorage.setItem(CONV_ID_KEY, id)
    await fetchConversations()
    return id
  }

  async function fetchConversations() {
    try {
      const { items } = await $fetch<{ items: ConversationSummary[] }>('/api/conversations')
      conversations.value = items ?? []
    } catch {
      /* non-fatal */
    }
  }

  async function loadConversation(id: string) {
    conversationLoading.value = true
    try {
      const conv = await $fetch<{
        id: string
        messages: Array<{ id: string; role: string; content: string; parts: unknown; sources: unknown }>
      }>(`/api/conversations/${id}`)
      conversationId.value = conv.id
      if (typeof window !== 'undefined') window.sessionStorage.setItem(CONV_ID_KEY, conv.id)
      chat.messages = conv.messages.map((m) => {
        const rawParts: Array<{ type: string; [key: string]: unknown }> =
          Array.isArray(m.parts) && (m.parts as unknown[]).length
            ? (m.parts as Array<{ type: string }>)
            : [{ type: 'text', text: m.content }]

        const storedSources = Array.isArray(m.sources) ? m.sources : []
        const partsForApi = rawParts.filter((p) => !p.type.startsWith('tool-') && p.type !== 'dynamic-tool')

        return {
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          parts: partsForApi,
          metadata: storedSources.length
            ? { sources: storedSources } satisfies ChatMessageMetadata
            : undefined,
        }
      }) as unknown as UIMessage[]
      expandedSet.clear()
      scrollToBottom()
    } catch (err) {
      console.error('failed to load conversation', err)
    } finally {
      conversationLoading.value = false
    }
  }

  async function newConversation() {
    conversationId.value = null
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(CONV_ID_KEY)
    chat.messages = []
    expandedSet.clear()
    userMsgMeta.clear()
  }

  async function deleteConversation(id: string) {
    await $fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (conversationId.value === id) await newConversation()
    await fetchConversations()
  }

  function dismissError() {
    dismissedError.value = chat.error
  }

  function toggleExpand(idx: number) {
    if (expandedSet.has(idx)) expandedSet.delete(idx)
    else expandedSet.add(idx)
  }

  function loadChatFromSession() {
    if (typeof window === 'undefined') return
    const savedConv = window.sessionStorage.getItem(CONV_ID_KEY)
    if (savedConv) {
      loadConversation(savedConv)
      return
    }
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        chat.messages = parsed as UIMessage[]
      }
    } catch {
      /* ignore */
    }
  }

  function scrollToBottom() {
    nextTick(() => {
      const el = scrollRef.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  watch(selectedSearchMode, (mode) => {
    if (typeof window !== 'undefined') localStorage.setItem(SEARCH_MODE_KEY, mode)
  })

  watch(selectedModel, (model) => {
    if (model) persistModel(model)
  })

  function selectCommand(cmd: { name: string; hasArgs: boolean }) {
    input.value = cmd.hasArgs ? `${cmd.name} ` : cmd.name
    selectedCommandIdx.value = -1
  }

  function onSuggestionSelect(suggestion: AiSuggestionItem) {
    if (suggestion.value.startsWith('/')) {
      input.value = suggestion.value
      return
    }
    navigateTo(suggestion.value)
  }

  async function send() {
    const text = input.value.trim()
    if (!text || isBusy.value) return
    if (text === '/new') {
      input.value = ''
      await newConversation()
      return
    }
    lastSentInput.value = text
    input.value = ''
    const pendingMeta = {
      searchMode: selectedSearchMode.value,
      docsCount: store.documents.length,
      charCount: text.length,
    }
    await ensureConversationId()
    await chat.sendMessage({ text })
    const lastUser = [...chat.messages].reverse().find((m) => m.role === 'user')
    if (lastUser) userMsgMeta.set(lastUser.id, pendingMeta)
    fetchConversations()
  }

  function clearChat() {
    newConversation()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_KEY)
    }
  }

  function initChatPage() {
    loadChatFromSession()
    fetchConversations()
    store.fetchDocuments()
    nextTick(scrollToBottom)
    useSearchParams().then((p) => { searchParams.value = p }).catch(() => {})
    fetchLlmModels().then((cfg) => {
      llmConfig.value = cfg
      const persisted = getPersistedModel()
      const valid = cfg.models.length === 0 || cfg.models.some((m) => m.value === persisted)
      selectedModel.value = (persisted && valid) ? persisted : cfg.defaultModel
    }).catch(() => {})
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem(SEARCH_MODE_KEY) : null
    if (savedMode === 'search' || savedMode === 'direct') selectedSearchMode.value = savedMode
  }

  watch(
    () => chat.messages.length,
    () => {
      if (typeof window === 'undefined') return
      if (!chat.messages.length) {
        window.sessionStorage.removeItem(SESSION_KEY)
        return
      }
      scrollToBottom()
    },
  )

  watch(
    () => chat.messages.map((m) => m.parts.length).join(','),
    () => {
      if (typeof window === 'undefined') return
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(chat.messages))
      scrollToBottom()
    },
  )

  watch(
    () => chat.status,
    (newStatus, oldStatus) => {
      if (
        (oldStatus === 'submitted' || oldStatus === 'streaming')
        && newStatus === 'ready'
        && lastSentInput.value.startsWith('/remember')
      ) {
        store.fetchDocuments()
      }
    },
  )

  watch(
    () => chat.error,
    (err) => {
      if (err && classifyLlmError(err).kind === 'provider_quota' && typeof window !== 'undefined') {
        window.sessionStorage.setItem(PROVIDER_QUOTA_KEY, String(Date.now()))
      }
    },
  )

  return {
    t,
    store,
    chat,
    input,
    scrollRef,
    expandedSet,
    conversationLoading,
    conversationId,
    conversations,
    conversationThreads,
    llmConfig,
    selectedModel,
    selectedSearchMode,
    llmModelOptions,
    searchParams,
    displayMessages,
    emptySuggestions,
    isBusy,
    isWaiting,
    isSearching,
    visibleChatError,
    chatErrorMessage,
    isAppRateLimitError,
    isProviderQuotaError,
    showCommandHelp,
    filteredCommands,
    selectedCommandIdx,
    send,
    clearChat,
    dismissError,
    toggleExpand,
    selectCommand,
    onSuggestionSelect,
    loadConversation,
    newConversation,
    deleteConversation,
    initChatPage,
    scrollToBottom,
  }
}
