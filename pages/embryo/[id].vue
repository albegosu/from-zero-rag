<script setup lang="ts">
import { useEmbryoStore, type EmbryoState } from '~/stores/embryos'

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

async function askAgent() {
  askingAgent.value = true
  agentError.value = null
  try {
    await $fetch(`/api/embryos/${id}/agent`, { method: 'POST' })
    await store.fetchOne(id)
  } catch (e: any) {
    agentError.value = e?.data?.statusMessage ?? 'Agent unavailable'
  } finally {
    askingAgent.value = false
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
  <div class="max-w-3xl mx-auto px-4 pt-6 pb-24 flex flex-col gap-5">

    <!-- back -->
    <NuxtLink to="/" class="wz-faint text-xs hover:wz-accent transition-colors">← garden</NuxtLink>

    <!-- loading / error -->
    <div v-if="store.loading" class="wz-faint text-xs text-center py-12">excavating...</div>
    <div v-else-if="store.error" class="text-[var(--term-danger)] text-xs p-3 border border-[var(--term-danger)]">
      error: {{ store.error }}
    </div>

    <template v-else-if="embryo">

      <!-- seed -->
      <div class="wz-panel">
        <div class="wz-panel-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span :class="['text-xs font-mono', stateColor(embryo.state)]">
              {{ LIFECYCLE.find(l => l.state === embryo!.state)!.glyph }}
              {{ embryo.state.toLowerCase() }}
            </span>
          </div>
          <span class="wz-faint text-[10px]">{{ new Date(embryo.createdAt).toLocaleString() }}</span>
        </div>
        <div class="p-4">
          <p class="text-sm wz-strong leading-relaxed font-mono">{{ embryo.seed }}</p>
          <div v-if="isFossil && embryo.fossilReason" class="mt-3 pt-3 border-t border-[var(--term-accent-faint)]">
            <p class="text-[11px] wz-faint">fossilized: <span class="wz-muted">{{ embryo.fossilReason }}</span></p>
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
      <div v-if="!isFossil" class="wz-panel">
        <div class="wz-panel-header flex items-center justify-between">
          <div>
            <span class="wz-accent">$</span>
            <span class="wz-label ml-2">agent.collaborate</span>
          </div>
          <button
            class="text-[11px] wz-accent border border-[var(--term-accent-line)] px-2 py-0.5 hover:bg-[var(--term-accent-soft)] disabled:opacity-40 transition-colors"
            :disabled="askingAgent"
            @click="askAgent"
          >
            {{ askingAgent ? 'thinking...' : '↯ ask' }}
          </button>
        </div>
        <div v-if="agentError" class="px-4 py-3 text-[11px] text-[var(--term-danger)]">{{ agentError }}</div>
        <div v-if="embryo.agentNotes.length" class="divide-y divide-[var(--term-accent-faint)]">
          <div
            v-for="note in embryo.agentNotes"
            :key="note.id"
            class="px-4 py-3"
          >
            <p class="text-[10px] wz-faint mb-1">{{ note.type.toLowerCase().replace('_', ' ') }}</p>
            <p class="text-xs wz-strong leading-relaxed">{{ note.content }}</p>
          </div>
        </div>
        <div v-else class="px-4 py-3 wz-faint text-[11px]">no agent notes yet — press ↯ ask to engage</div>
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
      <div class="wz-panel">
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
      <div v-if="embryo.connections.length || embryo.connectedTo.length" class="wz-panel">
        <div class="wz-panel-header">
          <span class="wz-accent">$</span>
          <span class="wz-label ml-2">connections</span>
        </div>
        <div class="divide-y divide-[var(--term-accent-faint)]">
          <NuxtLink
            v-for="c in embryo.connections"
            :key="c.id"
            :to="`/embryo/${c.targetId}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--term-accent-soft)] transition-colors"
          >
            <span class="text-[10px] wz-faint w-20 shrink-0">{{ c.type.toLowerCase() }}</span>
            <span class="text-xs wz-muted truncate">{{ c.target.seed }}</span>
            <span v-if="!c.confirmedByUser" class="text-[10px] text-[var(--term-warn)] shrink-0">unconfirmed</span>
          </NuxtLink>
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
      </div>

      <!-- event history -->
      <div class="wz-panel">
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
