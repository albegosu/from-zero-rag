<script setup lang="ts">
import { useEmbryoStore, type EmbryoState, type ConnectionType, type EmbryoSummary } from '~/stores/embryos'

const route = useRoute()
const store = useEmbryoStore()
const id = route.params.id as string

const tensionInput = ref('')
const fossilReason = ref('')
const showFossilDialog = ref(false)
const addingTension = ref(false)
const fossilizing = ref(false)
const askingAgent = ref(false)
const agentError = ref<string | null>(null)
const agentStream = ref('')

const showConnectDialog = ref(false)
const connectSearch = ref('')
const connectType = ref<ConnectionType>('EXTENDS')
const connectNote = ref('')
const connecting = ref(false)
const connectCandidates = ref<Array<{ id: string; seed: string; state: EmbryoState }>>([])

const CONNECTION_TYPES: Array<{ value: ConnectionType; label: string; glyph: string }> = [
  { value: 'REINFORCES',  label: 'reinforces',  glyph: '⟶' },
  { value: 'CONTRADICTS',  label: 'contradicts', glyph: '⟷' },
  { value: 'EXTENDS',      label: 'extends',     glyph: '⤴' },
  { value: 'RESURRECTS',   label: 'resurrects',  glyph: '↺' },
]

const filteredCandidates = computed(() => {
  const q = connectSearch.value.toLowerCase().trim()
  if (!q) return connectCandidates.value
  return connectCandidates.value.filter(e =>
    e.seed.toLowerCase().includes(q) || e.id.includes(q),
  )
})

async function openConnectDialog() {
  showConnectDialog.value = true
  connectSearch.value = ''
  const all = await $fetch<EmbryoSummary[]>('/api/embryos')
  const existing = new Set([
    id,
    ...(store.current?.connections.map(c => c.targetId) ?? []),
  ])
  connectCandidates.value = all
    .filter(e => !existing.has(e.id))
    .map(e => ({ id: e.id, seed: e.seed, state: e.state }))
}

async function askAgent() {
  askingAgent.value = true
  agentError.value = null
  agentStream.value = ''

  try {
    const response = await fetch(`/api/embryos/${id}/agent`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.statusMessage || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No stream')

    const decoder = new TextDecoder()
    let buffer = ''

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
          if (data.type === 'chunk') {
            agentStream.value += data.text
          } else if (data.type === 'error') {
            agentError.value = data.message
          } else if (data.type === 'done') {
            await store.fetchOne(id)
          }
        } catch {}
      }
    }
  } catch (e: any) {
    agentError.value = e?.message ?? 'Agent unavailable'
  } finally {
    askingAgent.value = false
    agentStream.value = ''
  }
}

const LIFECYCLE: Array<{ state: EmbryoState; glyph: string }> = [
  { state: 'LATENT',      glyph: '◌' },
  { state: 'GERMINATING', glyph: '◎' },
  { state: 'GROWING',     glyph: '●' },
  { state: 'MATURE',      glyph: '◉' },
  { state: 'FOSSIL',      glyph: '◈' },
]

const embryo = computed(() => store.current)
const isFossil = computed(() => embryo.value?.state === 'FOSSIL')

const pendingConnections = computed(() =>
  embryo.value?.agentNotes.filter(n => n.type === 'PENDING_CONNECTION') ?? [],
)
const pendingQuestions = computed(() =>
  embryo.value?.agentNotes.filter(n => n.type !== 'PENDING_CONNECTION') ?? [],
)

function parseConnectionNote(content: string): { type: string; targetId: string; reason: string } | null {
  const match = content.match(/^(\w+)\s+\[([^\]]+)\]:\s*(.+)$/)
  if (!match) return null
  return { type: match[1]!, targetId: match[2]!, reason: match[3]! }
}

async function acceptConnection(noteId: string, content: string) {
  const parsed = parseConnectionNote(content)
  if (!parsed) return
  await store.connect(id, parsed.targetId, parsed.type as ConnectionType, parsed.reason)
  await store.dismissNote(id, noteId)
}

function stateColor(state: EmbryoState) {
  return {
    LATENT:      'text-[var(--term-text-faint)]',
    GERMINATING: 'text-[var(--term-accent)]',
    GROWING:     'text-[var(--term-accent-strong)]',
    MATURE:      'text-[var(--term-text-strong)]',
    FOSSIL:      'text-[var(--term-text-dim)]',
  }[state]
}

async function transition(state: Exclude<EmbryoState, 'FOSSIL'>) {
  await store.transition(id, state)
}

async function submitTension() {
  const q = tensionInput.value.trim()
  if (!q) return
  addingTension.value = true
  await store.addTension(id, q)
  tensionInput.value = ''
  addingTension.value = false
}

async function submitFossilize() {
  if (!fossilReason.value.trim()) return
  fossilizing.value = true
  await store.fossilize(id, fossilReason.value.trim())
  showFossilDialog.value = false
  fossilReason.value = ''
  fossilizing.value = false
}

async function submitConnection(targetId: string) {
  connecting.value = true
  await store.connect(id, targetId, connectType.value, connectNote.value.trim() || undefined)
  connectNote.value = ''
  connectSearch.value = ''
  showConnectDialog.value = false
  connecting.value = false
}

const EVENT_LABELS: Record<string, string> = {
  CREATED: 'created',
  STATE_CHANGED: 'state →',
  TENSION_ADDED: 'tension added',
  TENSION_RESOLVED: 'tension resolved',
  CONNECTION_MADE: 'connection',
  AGENT_QUESTION: 'agent asked',
  AGENT_SUGGESTION: 'agent suggested',
  USER_RESPONSE: 'responded',
  FOSSIL_PROPOSED: 'fossil proposed',
  FOSSILIZED: 'fossilized',
}

onMounted(() => store.fetchOne(id))
</script>

<template>
  <div
    class="max-w-3xl mx-auto px-4 pt-6 pb-24 flex flex-col gap-5"
    :class="{ 'fossil-view': isFossil }"
  >

    <!-- back -->
    <NuxtLink to="/" class="wz-faint text-xs hover:wz-accent transition-colors">← garden</NuxtLink>

    <!-- loading / error -->
    <div v-if="store.loading" class="wz-faint text-xs text-center py-12">excavating...</div>
    <div v-else-if="store.error" class="text-[var(--term-danger)] text-xs p-3 border border-[var(--term-danger)]">
      error: {{ store.error }}
    </div>

    <template v-else-if="embryo">

      <!-- seed -->
      <div class="wz-panel" :class="{ 'fossil-panel': isFossil }">
        <div class="wz-panel-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span :class="['text-xs font-mono', stateColor(embryo.state)]">
              {{ LIFECYCLE.find(l => l.state === embryo!.state)!.glyph }}
              {{ embryo.state.toLowerCase() }}
            </span>
            <span v-if="isFossil" class="text-[10px] text-[var(--term-text-dim)] opacity-60 font-mono">
              — fossilized {{ embryo.fossilizedAt ? new Date(embryo.fossilizedAt).toLocaleDateString() : '' }}
            </span>
          </div>
          <span class="wz-faint text-[10px]">{{ new Date(embryo.createdAt).toLocaleString() }}</span>
        </div>
        <div class="p-4">
          <p class="text-sm leading-relaxed font-mono" :class="isFossil ? 'text-[var(--term-text-dim)]' : 'wz-strong'">
            {{ embryo.seed }}
          </p>
          <div v-if="isFossil && embryo.fossilReason" class="mt-3 pt-3 border-t border-[var(--term-text-dim)] fossil-reason">
            <p class="text-[10px] text-[var(--term-text-dim)] uppercase tracking-wider mb-1">cause of fossilization</p>
            <p class="text-xs text-[var(--term-text-dim)]">{{ embryo.fossilReason }}</p>
          </div>
        </div>
      </div>

      <!-- lifecycle transitions -->
      <div v-if="!isFossil" class="wz-panel">
        <div class="wz-panel-header">
          <span class="wz-accent">$</span>
          <span class="wz-label ml-2">lifecycle.transition</span>
        </div>
        <div class="p-4 flex flex-wrap gap-2">
          <button
            v-for="step in LIFECYCLE.filter(l => l.state !== 'FOSSIL' && l.state !== embryo!.state)"
            :key="step.state"
            class="text-[11px] px-2 py-1 border border-[var(--term-accent-faint)] wz-faint hover:border-[var(--term-accent-line)] hover:wz-accent transition-colors"
            @click="transition(step.state as Exclude<EmbryoState, 'FOSSIL'>)"
          >
            → {{ step.glyph }} {{ step.state.toLowerCase() }}
          </button>
          <button
            class="text-[11px] px-2 py-1 border border-[var(--term-danger)] text-[var(--term-danger)] opacity-60 hover:opacity-100 transition-opacity ml-auto"
            @click="showFossilDialog = true"
          >
            ◈ fossilize
          </button>
        </div>
      </div>

      <!-- agent panel -->
      <div class="wz-panel" :class="{ 'fossil-panel': isFossil }">
        <div class="wz-panel-header flex items-center justify-between">
          <div>
            <span class="wz-accent">$</span>
            <span class="wz-label ml-2">agent.collaborate</span>
          </div>
          <button
            v-if="!isFossil"
            class="text-[11px] wz-accent border border-[var(--term-accent-line)] px-2 py-0.5 hover:bg-[var(--term-accent-soft)] disabled:opacity-40 transition-colors"
            :disabled="askingAgent"
            @click="askAgent"
          >
            {{ askingAgent ? 'thinking...' : '↯ ask' }}
          </button>
        </div>

        <!-- streaming output -->
        <div v-if="agentStream" class="px-4 py-3 border-b border-[var(--term-accent-faint)]">
          <p class="text-[10px] wz-accent mb-1">streaming...</p>
          <p class="text-xs wz-strong leading-relaxed font-mono whitespace-pre-wrap">{{ agentStream }}</p>
        </div>

        <div v-if="agentError" class="px-4 py-3 text-[11px] text-[var(--term-danger)]">{{ agentError }}</div>

        <!-- pending connection suggestions from agent -->
        <div v-if="pendingConnections.length" class="divide-y divide-[var(--term-accent-faint)]">
          <div
            v-for="note in pendingConnections"
            :key="note.id"
            class="px-4 py-3 flex items-start justify-between gap-3 bg-[var(--term-accent-soft)]"
          >
            <div class="flex-1 min-w-0">
              <p class="text-[10px] wz-accent mb-1">suggested connection</p>
              <p class="text-xs wz-strong leading-relaxed">{{ parseConnectionNote(note.content)?.reason ?? note.content }}</p>
              <p class="text-[10px] wz-faint mt-1">
                {{ parseConnectionNote(note.content)?.type?.toLowerCase() }} →
                {{ parseConnectionNote(note.content)?.targetId }}
              </p>
            </div>
            <div v-if="!isFossil" class="flex gap-2 shrink-0">
              <button
                class="text-[10px] wz-accent hover:wz-strong transition-colors"
                @click="acceptConnection(note.id, note.content)"
              >
                accept ✓
              </button>
              <button
                class="text-[10px] wz-faint hover:text-[var(--term-danger)] transition-colors"
                @click="store.dismissNote(id, note.id)"
              >
                dismiss ×
              </button>
            </div>
          </div>
        </div>

        <!-- agent question notes -->
        <div v-if="pendingQuestions.length" class="divide-y divide-[var(--term-accent-faint)]">
          <div
            v-for="note in pendingQuestions"
            :key="note.id"
            class="px-4 py-3 flex items-start justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-[10px] wz-faint mb-1">{{ note.type.toLowerCase().replace('_', ' ') }}</p>
              <p class="text-xs wz-strong leading-relaxed">{{ note.content }}</p>
            </div>
            <button
              v-if="!isFossil"
              class="text-[10px] wz-faint hover:text-[var(--term-danger)] shrink-0 transition-colors"
              @click="store.dismissNote(id, note.id)"
            >
              dismiss ×
            </button>
          </div>
        </div>
        <div v-if="!pendingQuestions.length && !pendingConnections.length && !agentStream" class="px-4 py-3 wz-faint text-[11px]">
          {{ isFossil ? 'no agent notes recorded' : 'no agent notes yet — press ↯ ask to engage' }}
        </div>
      </div>

      <!-- fossilize dialog -->
      <div v-if="showFossilDialog" class="wz-panel border-[var(--term-danger)]">
        <div class="wz-panel-header" style="border-color: var(--term-danger)">
          <span class="text-[var(--term-danger)] text-xs">◈ fossilize — this cannot be undone</span>
        </div>
        <div class="p-4 flex flex-col gap-3">
          <textarea
            v-model="fossilReason"
            rows="2"
            placeholder="why is this closing? (required)"
            class="bg-transparent resize-none text-sm wz-strong placeholder:wz-faint focus:outline-none font-mono w-full"
          />
          <div class="flex gap-2 justify-end">
            <button class="text-xs wz-faint px-3 py-1 hover:wz-muted" @click="showFossilDialog = false">cancel</button>
            <button
              class="text-xs px-3 py-1 border border-[var(--term-danger)] text-[var(--term-danger)] disabled:opacity-40 hover:bg-red-950/30 transition-colors"
              :disabled="!fossilReason.trim() || fossilizing"
              @click="submitFossilize"
            >
              {{ fossilizing ? '...' : 'confirm fossilize' }}
            </button>
          </div>
        </div>
      </div>

      <!-- tensions -->
      <div class="wz-panel" :class="{ 'fossil-panel': isFossil }">
        <div class="wz-panel-header flex items-center justify-between">
          <div>
            <span class="wz-accent">$</span>
            <span class="wz-label ml-2">tensions.open</span>
          </div>
          <span class="wz-faint text-[10px]">{{ embryo.tensions.filter(t => !t.resolved).length }} unresolved</span>
        </div>
        <div class="divide-y divide-[var(--term-accent-faint)]">
          <div
            v-for="t in embryo.tensions"
            :key="t.id"
            class="px-4 py-3 flex items-start justify-between gap-3"
            :class="t.resolved ? 'opacity-40' : ''"
          >
            <div>
              <span class="text-[10px] wz-faint mr-2">{{ t.raisedBy.toLowerCase() }}</span>
              <span class="text-xs wz-strong">{{ t.question }}</span>
            </div>
            <button
              v-if="!t.resolved && !isFossil"
              class="text-[10px] wz-faint hover:wz-accent shrink-0 transition-colors"
              @click="store.resolveTension(id, t.id)"
            >
              resolve ✓
            </button>
            <span v-else-if="t.resolved" class="text-[10px] wz-faint shrink-0">resolved</span>
          </div>
        </div>
        <div v-if="!isFossil" class="p-4 border-t border-[var(--term-accent-faint)] flex gap-3">
          <input
            v-model="tensionInput"
            type="text"
            placeholder="add an open question..."
            class="flex-1 bg-transparent text-xs wz-strong placeholder:wz-faint focus:outline-none font-mono"
            @keydown.enter="submitTension"
          />
          <button
            class="text-[11px] wz-accent border border-[var(--term-accent-line)] px-2 py-0.5 hover:bg-[var(--term-accent-soft)] disabled:opacity-40 transition-colors"
            :disabled="!tensionInput.trim() || addingTension"
            @click="submitTension"
          >
            +
          </button>
        </div>
      </div>

      <!-- connections -->
      <div class="wz-panel" :class="{ 'fossil-panel': isFossil }">
        <div class="wz-panel-header flex items-center justify-between">
          <div>
            <span class="wz-accent">$</span>
            <span class="wz-label ml-2">connections</span>
          </div>
          <button
            v-if="!isFossil"
            class="text-[11px] wz-accent border border-[var(--term-accent-line)] px-2 py-0.5 hover:bg-[var(--term-accent-soft)] transition-colors"
            @click="openConnectDialog"
          >
            + connect
          </button>
        </div>

        <!-- connect dialog with search -->
        <div v-if="showConnectDialog" class="px-4 py-3 border-b border-[var(--term-accent-faint)] flex flex-col gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ct in CONNECTION_TYPES"
              :key="ct.value"
              class="text-[11px] px-2 py-0.5 border transition-colors"
              :class="connectType === ct.value
                ? 'border-[var(--term-accent)] wz-accent bg-[var(--term-accent-soft)]'
                : 'border-[var(--term-accent-faint)] wz-faint hover:border-[var(--term-accent-line)]'"
              @click="connectType = ct.value"
            >
              {{ ct.glyph }} {{ ct.label }}
            </button>
          </div>
          <input
            v-model="connectSearch"
            type="text"
            placeholder="search embryos..."
            class="bg-transparent text-xs wz-strong placeholder:wz-faint focus:outline-none font-mono w-full border-b border-[var(--term-accent-faint)] pb-2"
          />
          <div class="max-h-48 overflow-y-auto flex flex-col gap-1">
            <button
              v-for="candidate in filteredCandidates.slice(0, 10)"
              :key="candidate.id"
              class="text-left px-2 py-1.5 text-xs hover:bg-[var(--term-accent-soft)] transition-colors flex items-center gap-2 group"
              :disabled="connecting"
              @click="submitConnection(candidate.id)"
            >
              <span :class="['text-[10px] font-mono shrink-0', stateColor(candidate.state)]">
                {{ LIFECYCLE.find(l => l.state === candidate.state)?.glyph }}
              </span>
              <span class="wz-muted truncate flex-1 group-hover:wz-strong">{{ candidate.seed }}</span>
            </button>
            <p v-if="filteredCandidates.length === 0" class="text-[11px] wz-faint py-2 text-center">
              {{ connectCandidates.length === 0 ? 'no other embryos available' : 'no matches' }}
            </p>
          </div>
          <input
            v-model="connectNote"
            type="text"
            placeholder="note (optional)"
            class="bg-transparent text-xs wz-strong placeholder:wz-faint focus:outline-none font-mono w-full"
          />
          <div class="flex justify-end">
            <button class="text-xs wz-faint px-3 py-1 hover:wz-muted" @click="showConnectDialog = false">cancel</button>
          </div>
        </div>

        <!-- existing connections -->
        <div v-if="embryo.connections.length || embryo.connectedTo.length" class="divide-y divide-[var(--term-accent-faint)]">
          <div
            v-for="c in embryo.connections"
            :key="c.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <span class="text-[10px] wz-faint w-20 shrink-0">{{ c.type.toLowerCase() }}</span>
            <NuxtLink
              :to="`/embryo/${c.targetId}`"
              class="text-xs wz-muted truncate flex-1 hover:wz-accent transition-colors"
            >
              {{ c.target.seed }}
            </NuxtLink>
            <button
              v-if="!c.confirmedByUser && !isFossil"
              class="text-[10px] text-[var(--term-warn)] hover:wz-accent shrink-0 transition-colors"
              @click="store.confirmConnection(id, c.id)"
            >
              confirm ✓
            </button>
            <span v-else-if="!c.confirmedByUser" class="text-[10px] text-[var(--term-warn)] shrink-0">unconfirmed</span>
          </div>
          <NuxtLink
            v-for="c in embryo.connectedTo"
            :key="c.id"
            :to="`/embryo/${c.sourceId}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--term-accent-soft)] transition-colors"
          >
            <span class="text-[10px] wz-faint w-20 shrink-0">← {{ c.type.toLowerCase() }}</span>
            <span class="text-xs wz-muted truncate">{{ c.source.seed }}</span>
          </NuxtLink>
        </div>
        <div v-else-if="!showConnectDialog" class="px-4 py-3 wz-faint text-[11px]">no connections yet</div>
      </div>

      <!-- event history -->
      <div class="wz-panel" :class="{ 'fossil-panel': isFossil }">
        <div class="wz-panel-header">
          <span class="wz-accent">$</span>
          <span class="wz-label ml-2">history.log</span>
        </div>
        <div class="divide-y divide-[var(--term-accent-faint)]">
          <div
            v-for="ev in [...embryo.events].reverse()"
            :key="ev.id"
            class="px-4 py-2.5 flex items-center gap-3"
          >
            <span class="text-[10px] wz-faint shrink-0 w-28">{{ new Date(ev.createdAt).toLocaleString() }}</span>
            <span class="text-[10px] wz-faint w-14 shrink-0">{{ ev.initiatedBy.toLowerCase() }}</span>
            <span class="text-xs wz-muted">{{ EVENT_LABELS[ev.type] ?? ev.type.toLowerCase() }}</span>
            <span v-if="ev.payload?.to" class="text-[10px] wz-accent">{{ ev.payload.to }}</span>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.fossil-view {
  position: relative;
}
.fossil-view::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    color-mix(in srgb, var(--term-text-dim) 4%, transparent) 3px,
    color-mix(in srgb, var(--term-text-dim) 4%, transparent) 4px
  );
  z-index: 0;
}

.fossil-panel {
  opacity: 0.75;
  border-style: dashed !important;
}

.fossil-reason {
  border-style: dashed;
  opacity: 0.8;
}
</style>
