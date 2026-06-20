import type { UIMessage } from 'ai'
import type { AiMessageProps, AiSource, AiToolCall } from '#ai-elements/types'
import type { SearchResult, ConverseSource } from '~/stores/documents'

export interface KbToolOutput {
  context: string
  sources: ConverseSource[]
  results: SearchResult[]
  count: number
  latencyMs?: number
}

export interface ChatMessageMetadata {
  sources?: ConverseSource[]
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
}

export interface UserMessageMetrics {
  searchMode: string
  docsCount: number
  charCount: number
  inputTokens?: number
  outputTokens?: number
}

export interface HyparDisplayMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  aiProps: AiMessageProps
  sources?: ConverseSource[]
  results?: SearchResult[]
  searched: boolean | null
  cited: boolean
  latencyMs?: number
  userMetrics?: UserMessageMetrics
  kbToolCalls: AiToolCall[]
}

function normalizeToolSources(
  sources: ConverseSource[] | undefined,
  untitledLabel: string,
): ConverseSource[] | undefined {
  if (!sources?.length) return undefined
  return sources.map((raw) => {
    const s = raw as ConverseSource & { id?: string; title?: string }
    const title = (s.documentTitle || s.title || '').trim()
    return {
      chunkId: s.chunkId ?? '',
      documentId: s.documentId ?? s.id ?? '',
      documentTitle: title || untitledLabel,
      score: typeof s.score === 'number' ? s.score : 0,
    }
  })
}

function usageFromAssistantMeta(meta: ChatMessageMetadata | undefined): {
  inputTokens?: number
  outputTokens?: number
} {
  const u = meta?.usage
  if (!u) return {}
  return {
    inputTokens: u.inputTokens,
    outputTokens: u.outputTokens,
  }
}

function sourcesToAiSources(sources: ConverseSource[]): AiSource[] {
  return sources.map((s, i) => ({
    id: s.chunkId || String(i),
    title: s.documentTitle,
    url: s.documentId ? `/documents/${s.documentId}` : undefined,
    score: s.score,
  }))
}

export function useHyparChatDisplay(options: {
  messages: Ref<UIMessage[]>
  chatStatus: Ref<string>
  userMsgMeta: Map<string, { searchMode: string; docsCount: number; charCount: number }>
  selectedSearchMode: Ref<string>
  docsCount: Ref<number>
  noModelReplyLabel: Ref<string>
  untitledLabel: Ref<string>
}) {
  const displayMessages = computed<HyparDisplayMessage[]>(() => {
    const raw = options.messages.value
    const status = options.chatStatus.value
    const isStreaming = status === 'submitted' || status === 'streaming'

    return raw.map((m, i) => {
      let text = ''
      let toolOutput: KbToolOutput | null = null
      let toolCalled = false
      for (const part of m.parts) {
        if (part.type === 'text') {
          text += (part as { text: string }).text
        } else if (
          (part.type === 'tool-searchKnowledgeBase' || part.type === 'dynamic-tool')
          && 'state' in part
        ) {
          toolCalled = true
          const p = part as { state: string; output?: unknown }
          if (p.state === 'output-available' && p.output) {
            toolOutput = p.output as KbToolOutput
          }
        }
      }

      const assistantNoTextButRetrieved =
        m.role === 'assistant' && !text.trim() && toolOutput != null && toolCalled
      const displayText = assistantNoTextButRetrieved
        ? options.noModelReplyLabel.value
        : text

      const metaSources = (m.metadata as ChatMessageMetadata | undefined)?.sources
      const sources = normalizeToolSources(
        toolOutput?.sources ?? metaSources,
        options.untitledLabel.value,
      )
      const hadKbSearch = toolCalled || (metaSources?.length ?? 0) > 0
      const cited = m.role === 'assistant'
        && !!sources?.length
        && /\[\d+\]/.test(text)

      let userMetrics: UserMessageMetrics | undefined
      if (m.role === 'user') {
        const stored = options.userMsgMeta.get(m.id)
        const next = raw[i + 1]
        const tokenUsage =
          next?.role === 'assistant'
            ? usageFromAssistantMeta(next.metadata as ChatMessageMetadata | undefined)
            : {}
        if (stored || tokenUsage.inputTokens != null || tokenUsage.outputTokens != null) {
          userMetrics = {
            searchMode: stored?.searchMode ?? options.selectedSearchMode.value,
            docsCount: stored?.docsCount ?? options.docsCount.value,
            charCount: stored?.charCount ?? text.length,
            ...tokenUsage,
          }
        }
      }

      const isLast = i === raw.length - 1
      const msgStreaming = isStreaming && isLast && m.role === 'assistant'
      const aiProps = toAiMessageProps(m, msgStreaming ? 'streaming' : 'complete')
      aiProps.content = m.role === 'assistant' ? displayText : text
      if (m.role === 'assistant' && sources?.length) {
        aiProps.sources = sourcesToAiSources(sources)
      }

      const kbToolCalls = (aiProps.toolCalls ?? []).filter(
        (tc: AiToolCall) => tc.name === 'searchKnowledgeBase' || tc.name.includes('search'),
      )

      return {
        id: m.id,
        role: m.role as HyparDisplayMessage['role'],
        text: m.role === 'assistant' ? displayText : text,
        aiProps,
        sources,
        results: toolOutput?.results,
        searched: m.role === 'assistant' ? (hadKbSearch ? true : (text ? false : null)) : null,
        cited,
        latencyMs: toolOutput?.latencyMs,
        userMetrics,
        kbToolCalls,
      }
    })
  })

  return { displayMessages }
}
