<script setup lang="ts">
import type { AiConfirmationData, AiContextItem, AiSuggestion } from 'ai-elements-nuxt/types'
import { extractPartialQuestion } from '~/utils/embryo-stream'
import { FOSSIL_KIND_COPY, parseFossilNote } from '~/utils/embryo-method'
import { appendTranscript, parseConnectionNote } from '~/utils/embryo-display'

const props = defineProps<{
  embryoId: string
}>()

const store = useEmbryoStore()
const { selectedModel } = useLlmModel()
const { locale } = useTerminalPrefs()

const askingAgent = ref(false)
const agentError = ref<string | null>(null)
const agentThinking = ref(false)
const streamPreview = ref('')
const replyInput = ref('')
const replying = ref(false)
const autoEngagedFor = ref<string | null>(null)
const germinatedNotice = ref(false)

const embryo = computed(() => store.current)
const isFossil = computed(() => embryo.value?.state === 'FOSSIL')

const pendingConnections = computed(() =>
  embryo.value?.agentNotes.filter(n => n.type === 'PENDING_CONNECTION') ?? [],
)
const pendingPaths = computed(() =>
  embryo.value?.agentNotes.filter(n => n.type === 'PENDING_PATH') ?? [],
)
const pendingFossil = computed(() =>
  embryo.value?.agentNotes.find(n => n.type === 'PENDING_FOSSIL') ?? null,
)
const pendingFossilParsed = computed(() =>
  pendingFossil.value ? parseFossilNote(pendingFossil.value.content) : null,
)
const unansweredQuestion = computed(() =>
  embryo.value?.agentNotes.find(n => n.type === 'PENDING_QUESTION') ?? null,
)

const dialogue = computed(() => {
  const events = embryo.value?.events ?? []
  const turns: Array<{ role: 'agent' | 'user'; text: string; at: string }> = []
  for (const ev of events) {
    if (ev.type === 'AGENT_QUESTION' && ev.payload?.question) {
      turns.push({ role: 'agent', text: String(ev.payload.question), at: ev.createdAt })
    }
    if (ev.type === 'USER_RESPONSE' && ev.payload?.reply) {
      turns.push({ role: 'user', text: String(ev.payload.reply), at: ev.createdAt })
    }
  }
  const pending = unansweredQuestion.value
  if (pending && !turns.some(t => t.role === 'agent' && t.text === pending.content)) {
    turns.push({ role: 'agent', text: pending.content, at: pending.createdAt })
  }
  return turns
})

const neverEngaged = computed(() => {
  const e = embryo.value
  if (!e) return true
  return !unansweredQuestion.value && !e.events.some(ev => ev.type === 'AGENT_QUESTION')
})

const firstEngageFailed = computed(() =>
  autoEngagedFor.value === props.embryoId
  && !askingAgent.value
  && neverEngaged.value
  && !!agentError.value,
)

const canAsk = computed(() =>
  !isFossil.value && !askingAgent.value && !unansweredQuestion.value && (!neverEngaged.value || firstEngageFailed.value),
)

/** Current unanswered question as the hero (streaming uses streamPreview in template). */
const focalChallenge = computed(() => unansweredQuestion.value?.content ?? null)

/** Prior completed turns — compact log, excluding the live unanswered question. */
const priorTurns = computed(() => {
  const pending = unansweredQuestion.value?.content
  const turns = dialogue.value.filter((t) => {
    if (pending && t.role === 'agent' && t.text === pending) return false
    return true
  })
  return turns.slice(-8)
})

const contextItems = computed<AiContextItem[]>(() => {
  const e = embryo.value
  if (!e) return []
  const items: AiContextItem[] = [
    { id: 'seed', type: 'document', title: 'seed', content: e.seed },
  ]
  const open = e.tensions.filter(t => !t.resolved)
  if (open.length) {
    items.push({
      id: 'tensions',
      type: 'memory',
      title: `${open.length} open tension${open.length === 1 ? '' : 's'}`,
      content: open.map(t => t.question).join(' · '),
    })
  }
  items.push({
    id: 'dialogue',
    type: 'custom',
    title: `${dialogue.value.length} prior turn${dialogue.value.length === 1 ? '' : 's'}`,
  })
  return items
})

const replySuggestions = computed<AiSuggestion[]>(() => {
  if (!unansweredQuestion.value || isFossil.value) return []
  return [{ id: 'skip', label: 'skip', value: 'skip' }]
})

const speechLang = computed(() => (locale.value === 'es' ? 'es-ES' : 'en-US'))

const emptyHint = computed(() => {
  if (agentThinking.value || (neverEngaged.value && !firstEngageFailed.value && !isFossil.value)) {
    return 'the agent is reading the seed...'
  }
  if (!pendingConnections.value.length && !pendingPaths.value.length && !pendingFossil.value) {
    return isFossil.value ? 'no exchange recorded' : 'waiting for the agent...'
  }
  return ''
})

async function askAgent() {
  askingAgent.value = true
  agentError.value = null
  agentThinking.value = true
  streamPreview.value = ''

  try {
    const response = await fetch(`/api/embryos/${props.embryoId}/agent`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel.value }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.statusMessage || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No stream')

    const decoder = new TextDecoder()
    let buffer = ''
    let raw = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'error') {
            agentError.value = data.message
          }
          else if (data.type === 'chunk' && typeof data.text === 'string') {
            raw += data.text
            streamPreview.value = extractPartialQuestion(raw) ?? streamPreview.value
          }
          else if (data.type === 'done') {
            streamPreview.value = ''
            germinatedNotice.value = Boolean(data.germinated)
            await store.fetchOne(props.embryoId, { silent: true })
          }
        }
        catch {}
      }
    }
  }
  catch (e: unknown) {
    agentError.value = e instanceof Error ? e.message : 'Agent unavailable'
  }
  finally {
    askingAgent.value = false
    agentThinking.value = false
    streamPreview.value = ''
  }
}

async function maybeAutoEngage(embryoId: string) {
  if (autoEngagedFor.value === embryoId) return
  const e = store.current
  if (!e || e.id !== embryoId || e.state === 'FOSSIL') return
  const pendingQuestion = e.agentNotes.some(n => n.type === 'PENDING_QUESTION')
  const everAsked = e.events.some(ev => ev.type === 'AGENT_QUESTION')
  if (pendingQuestion || everAsked) return
  autoEngagedFor.value = embryoId
  await askAgent()
}

async function submitReply() {
  const text = replyInput.value.trim()
  const note = unansweredQuestion.value
  if (!text || !note) return
  replying.value = true
  agentError.value = null
  const ok = await store.reply(props.embryoId, note.id, text)
  replying.value = false
  if (!ok) return
  replyInput.value = ''
  await askAgent()
}

function onReplySpeech(transcript: string, isFinal: boolean) {
  if (!isFinal) return
  replyInput.value = appendTranscript(replyInput.value, transcript)
}

function onSuggestion(suggestion: AiSuggestion) {
  if (suggestion.value === 'skip' && unansweredQuestion.value) {
    store.dismissNote(props.embryoId, unansweredQuestion.value.id)
  }
}

async function acceptConnection(noteId: string) {
  await store.acceptConnection(props.embryoId, noteId)
}

function connectionConfirmation(note: { id: string; content: string }): AiConfirmationData {
  const parsed = parseConnectionNote(note.content)
  return {
    id: note.id,
    title: 'suggested connection',
    description: parsed
      ? `${parsed.reason} — ${parsed.type.toLowerCase()} → ${parsed.targetId}`
      : note.content,
    confirmLabel: 'accept',
    denyLabel: 'dismiss',
  }
}

function pathConfirmation(note: { id: string; content: string }): AiConfirmationData {
  return {
    id: note.id,
    title: 'suggested path',
    description: note.content,
    confirmLabel: 'keep as tension',
    denyLabel: 'dismiss',
  }
}

const fossilConfirmation = computed<AiConfirmationData | null>(() => {
  if (!pendingFossil.value) return null
  const parsed = pendingFossilParsed.value
  return {
    id: pendingFossil.value.id,
    title: 'fossil proposed',
    description: parsed
      ? `${FOSSIL_KIND_COPY[parsed.kind].label}: ${parsed.reason}`
      : pendingFossil.value.content,
    confirmLabel: 'fossilize',
    denyLabel: 'dismiss',
    destructive: true,
  }
})

watch(() => props.embryoId, () => {
  autoEngagedFor.value = null
  germinatedNotice.value = false
  replyInput.value = ''
  agentError.value = null
  streamPreview.value = ''
})

watch(
  [() => props.embryoId, () => store.current?.id, () => store.loading],
  async ([embryoId, currentId, loading]) => {
    if (loading || currentId !== embryoId) return
    await maybeAutoEngage(embryoId)
  },
  { immediate: true },
)
</script>

<template>
  <div class="wz-panel" :class="{ 'fossil-panel': isFossil }">
    <div class="wz-panel-header flex items-center justify-between">
      <span class="wz-label">Agent challenge</span>
      <button
        v-if="canAsk"
        class="wz-btn-outline text-[11px] py-0.5 disabled:opacity-40"
        :disabled="askingAgent"
        @click="askAgent"
      >
        {{ dialogue.length ? 'Ask again' : 'Engage' }}
      </button>
      <span v-else-if="askingAgent" class="text-[11px] wz-accent">Thinking…</span>
    </div>

    <div
      v-if="germinatedNotice && !isFossil"
      class="px-4 py-2 text-[11px] wz-accent border-b border-[var(--term-accent-faint)]"
    >
      Advanced to germinating — first engage
    </div>

    <AiErrorBoundary
      v-if="agentError"
      :error="agentError"
      :retryable="canAsk || firstEngageFailed"
      @retry="askAgent"
      @dismiss="agentError = null"
    />

    <div v-if="contextItems.length" class="px-4 py-2 border-b border-[var(--term-accent-faint)]">
      <AiContext :items="contextItems" :collapsed="true" />
    </div>

    <div v-if="pendingConnections.length && !isFossil" class="divide-y divide-[var(--term-accent-faint)]">
      <AiConfirmation
        v-for="note in pendingConnections"
        :key="note.id"
        :confirmation="connectionConfirmation(note)"
        @confirm="acceptConnection(note.id)"
        @deny="store.dismissNote(embryoId, note.id)"
      />
    </div>

    <div v-if="pendingPaths.length && !isFossil" class="divide-y divide-[var(--term-accent-faint)] border-t border-[var(--term-accent-faint)]">
      <AiConfirmation
        v-for="note in pendingPaths"
        :key="note.id"
        :confirmation="pathConfirmation(note)"
        @confirm="store.acceptPath(embryoId, note.id)"
        @deny="store.dismissNote(embryoId, note.id)"
      />
    </div>

    <AiConfirmation
      v-if="fossilConfirmation && pendingFossil && !isFossil"
      :confirmation="fossilConfirmation"
      @confirm="store.acceptFossil(embryoId, pendingFossil.id)"
      @deny="store.dismissNote(embryoId, pendingFossil.id)"
    />

    <!-- Focal challenge: current unanswered / streaming question -->
    <div
      v-if="focalChallenge || askingAgent"
      class="hypar-challenge-hero"
    >
      <p class="hypar-challenge-hero__label">Current challenge</p>
      <AiShimmer v-if="askingAgent && !streamPreview && !focalChallenge" :active="true" :lines="2" />
      <p v-else class="hypar-challenge-hero__q">
        {{ streamPreview || focalChallenge }}
        <AiStreamingCursor v-if="askingAgent && streamPreview" :active="true" character="|" />
      </p>
    </div>

    <!-- Compact prior-turn log (not chat-stack dominant) -->
    <div v-if="priorTurns.length" class="hypar-turn-log border-b border-[var(--term-accent-faint)]">
      <div
        v-for="(turn, idx) in priorTurns"
        :key="`${turn.role}-${idx}`"
        class="hypar-turn-log__row"
      >
        <span class="hypar-turn-log__role">{{ turn.role === 'agent' ? 'agent' : 'you' }}</span>
        <span class="hypar-turn-log__text line-clamp-2">{{ turn.text }}</span>
      </div>
    </div>

    <div
      v-else-if="emptyHint && !focalChallenge && !askingAgent"
      class="px-4 py-3 wz-faint text-[11px]"
    >
      <AiShimmer v-if="agentThinking || (neverEngaged && !firstEngageFailed && !isFossil)" :active="true" :lines="2" />
      <span v-else>{{ emptyHint }}</span>
    </div>

    <div
      v-if="unansweredQuestion && !isFossil"
      class="p-4 border-t border-[var(--term-accent-faint)] flex flex-col gap-3"
    >
      <div class="flex items-start gap-2">
        <AiPromptInput
          v-model="replyInput"
          class="flex-1"
          :rows="3"
          submit-shortcut="mod+enter"
          placeholder="Reply — push back, go deeper, or name the assumption"
          :disabled="replying || askingAgent"
          :loading="replying || askingAgent"
          @submit="submitReply"
        />
        <AiSpeechInput
          class="hypar-speech shrink-0 pt-1"
          :language="speechLang"
          @result="onReplySpeech"
        >
          <template #transcript />
          <template #unsupported />
        </AiSpeechInput>
      </div>
      <div class="flex items-center justify-between gap-2">
        <AiSuggestion
          v-if="replySuggestions.length"
          :suggestions="replySuggestions"
          @select="onSuggestion"
        />
        <span v-else />
        <button
          class="wz-btn-primary text-[11px] disabled:opacity-40"
          :disabled="!replyInput.trim() || replying || askingAgent"
          @click="submitReply"
        >
          {{ replying ? '…' : 'Reply' }}
        </button>
      </div>
    </div>
  </div>
</template>

