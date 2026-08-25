<script setup lang="ts">
import { useEmbryoStore, type EmbryoState, type EmbryoSummary } from '~/stores/embryos'
import { LIFECYCLE, appendTranscript, stateColor } from '~/utils/embryo-display'
import { FOSSIL_STRATUM_COPY, fossilStratum, type FossilStratum } from '~/utils/embryo-lab'

const store = useEmbryoStore()
const { locale } = useTerminalPrefs()

const seedInput = ref('')
const creating = ref(false)
const activeFilter = ref<EmbryoState | 'ALL' | 'SURFACE' | 'STRATA'>('ALL')

const speechLang = computed(() => (locale.value === 'es' ? 'es-ES' : 'en-US'))

const STRATA_ORDER: FossilStratum[] = ['recent', 'mid', 'deep']

const visible = computed(() => {
  let list: EmbryoSummary[]
  if (activeFilter.value === 'SURFACE') list = store.alive
  else if (activeFilter.value === 'STRATA') list = store.byState.FOSSIL
  else if (activeFilter.value === 'ALL') list = store.embryos
  else list = store.embryos.filter(e => e.state === activeFilter.value)

  return [...list].sort((a, b) => {
    if (activeFilter.value === 'STRATA') {
      const ta = a.fossilizedAt ? new Date(a.fossilizedAt).getTime() : 0
      const tb = b.fossilizedAt ? new Date(b.fossilizedAt).getTime() : 0
      return tb - ta
    }
    if (a.state === 'FOSSIL' && b.state !== 'FOSSIL') return 1
    if (a.state !== 'FOSSIL' && b.state === 'FOSSIL') return -1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

const strataGroups = computed(() => {
  if (activeFilter.value !== 'STRATA') return null
  const groups: Record<FossilStratum, EmbryoSummary[]> = { recent: [], mid: [], deep: [] }
  for (const e of visible.value) {
    groups[fossilStratum(e.fossilizedAt)].push(e)
  }
  return STRATA_ORDER
    .filter(s => groups[s].length > 0)
    .map(s => ({ stratum: s, ...FOSSIL_STRATUM_COPY[s], items: groups[s] }))
})

async function submitSeed() {
  const seed = seedInput.value.trim()
  if (!seed) return
  creating.value = true
  const embryo = await store.create(seed)
  creating.value = false
  if (embryo) {
    seedInput.value = ''
    await navigateTo(`/embryo/${embryo.id}`)
  }
}

function onSeedSpeech(transcript: string, isFinal: boolean) {
  if (!isFinal) return
  seedInput.value = appendTranscript(seedInput.value, transcript)
}

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pt-6 pb-24 flex flex-col gap-6">

    <!-- header -->
    <div class="wz-panel">
      <div class="wz-panel-header flex items-center justify-between">
        <span class="wz-faint text-[11px]">hypar // embryo garden</span>
        <span class="wz-faint text-[11px]">{{ store.alive.length }} alive · {{ store.byState.FOSSIL.length }} fossil</span>
      </div>
      <div class="px-4 pt-3 pb-4">
        <p class="wz-muted text-xs">capture a raw thought — the agent will challenge it</p>
      </div>
    </div>

    <!-- seed capture -->
    <div class="wz-panel">
      <div class="wz-panel-header">
        <span class="wz-accent">$</span>
        <span class="wz-label ml-2">embryo.create --capture</span>
      </div>
      <div class="p-4 flex gap-3">
        <textarea
          v-model="seedInput"
          rows="3"
          placeholder="drop the seed..."
          class="flex-1 bg-transparent resize-none text-sm wz-strong placeholder:wz-faint focus:outline-none font-mono"
          @keydown.meta.enter="submitSeed"
        />
        <div class="flex flex-col gap-2 self-end">
          <AiSpeechInput
            class="hypar-speech"
            :language="speechLang"
            @result="onSeedSpeech"
          >
            <template #transcript />
            <template #unsupported />
          </AiSpeechInput>
          <button
            class="px-3 py-1.5 text-xs wz-accent border border-[var(--term-accent-line)] hover:bg-[var(--term-accent-soft)] transition-colors disabled:opacity-40"
            :disabled="!seedInput.trim() || creating"
            @click="submitSeed"
          >
            {{ creating ? 'engaging...' : '+ seed' }}
          </button>
        </div>
      </div>
    </div>

    <GardenPendingQueue />

    <!-- filter bar -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="f in (['ALL', 'SURFACE', 'STRATA', ...LIFECYCLE.map(l => l.state)] as const)"
        :key="f"
        class="text-[11px] px-2 py-0.5 border transition-colors"
        :class="activeFilter === f
          ? 'border-[var(--term-accent)] wz-accent bg-[var(--term-accent-soft)]'
          : 'border-[var(--term-accent-faint)] wz-faint hover:border-[var(--term-accent-line)]'"
        @click="activeFilter = f"
      >
        {{ f === 'ALL' ? 'all' : f === 'SURFACE' ? 'surface' : f === 'STRATA' ? 'strata' : LIFECYCLE.find(l => l.state === f)!.glyph + ' ' + f.toLowerCase() }}
        <span class="opacity-50 ml-1">
          {{ f === 'ALL' ? store.embryos.length
            : f === 'SURFACE' ? store.alive.length
              : f === 'STRATA' ? store.byState.FOSSIL.length
                : store.byState[f].length }}
        </span>
      </button>
    </div>

    <!-- loading -->
    <div v-if="store.loading" class="wz-faint text-xs text-center py-8">scanning strata...</div>

    <!-- error -->
    <div v-else-if="store.error" class="text-[var(--term-danger)] text-xs p-3 border border-[var(--term-danger)]">
      error: {{ store.error }}
    </div>

    <!-- empty -->
    <div v-else-if="visible.length === 0" class="wz-faint text-xs text-center py-12">
      {{ store.embryos.length === 0 ? 'no embryos yet — plant the first seed' : 'no embryos in this state' }}
    </div>

    <!-- embryo list -->
    <div v-else-if="strataGroups" class="flex flex-col gap-6">
      <section v-for="group in strataGroups" :key="group.stratum" class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between px-1">
          <p class="text-[11px] wz-accent font-mono uppercase tracking-wider">{{ group.label }}</p>
          <p class="text-[10px] wz-faint font-mono">{{ group.depth }} · {{ group.items.length }}</p>
        </div>
        <NuxtLink
          v-for="e in group.items"
          :key="e.id"
          :to="`/embryo/${e.id}`"
          class="wz-panel group block transition-colors fossil-card"
          :class="`stratum-${group.stratum}`"
        >
          <div class="wz-panel-header flex items-center justify-between">
            <span :class="['text-xs font-mono', stateColor(e.state)]">
              {{ LIFECYCLE.find(l => l.state === e.state)!.glyph }}
              {{ e.state.toLowerCase() }}
            </span>
            <span class="wz-faint text-[10px]">{{ e.fossilizedAt ? new Date(e.fossilizedAt).toLocaleDateString() : '' }}</span>
          </div>
          <div class="p-4">
            <p class="text-sm leading-relaxed line-clamp-3 text-[var(--term-text-dim)]">{{ e.seed }}</p>
            <p v-if="e.fossilReason" class="text-[11px] text-[var(--term-text-dim)] mt-2 opacity-60 line-clamp-1">
              ◈ {{ e.fossilReason }}
            </p>
          </div>
        </NuxtLink>
      </section>
    </div>

    <div v-else class="flex flex-col gap-3">
      <NuxtLink
        v-for="e in visible"
        :key="e.id"
        :to="`/embryo/${e.id}`"
        class="wz-panel group block transition-colors"
        :class="e.state === 'FOSSIL' ? 'fossil-card' : 'hover:border-[var(--term-accent-line)]'"
      >
        <div class="wz-panel-header flex items-center justify-between">
          <span :class="['text-xs font-mono', stateColor(e.state)]">
            {{ LIFECYCLE.find(l => l.state === e.state)!.glyph }}
            {{ e.state.toLowerCase() }}
          </span>
          <div class="flex items-center gap-3 wz-faint text-[10px]">
            <span v-if="e._count.connections + e._count.connectedTo > 0" class="opacity-70">
              ⟶ {{ e._count.connections + e._count.connectedTo }}
            </span>
            <span v-if="e.tensions.filter(t => !t.resolved).length" class="text-[var(--term-warn)]">
              ⚡ {{ e.tensions.filter(t => !t.resolved).length }}
            </span>
            <span v-if="e.agentNotes.length" class="wz-accent opacity-70">
              ↯ {{ e.agentNotes.length }}
            </span>
            <span>{{ new Date(e.createdAt).toLocaleDateString() }}</span>
          </div>
        </div>
        <div class="p-4">
          <p
            class="text-sm leading-relaxed line-clamp-3"
            :class="e.state === 'FOSSIL' ? 'text-[var(--term-text-dim)]' : 'wz-strong'"
          >
            {{ e.seed }}
          </p>
          <p v-if="e.state === 'FOSSIL' && e.fossilReason" class="text-[11px] text-[var(--term-text-dim)] mt-2 opacity-60 line-clamp-1">
            ◈ {{ e.fossilReason }}
          </p>
        </div>
      </NuxtLink>
    </div>

  </div>
</template>

<style scoped>
.fossil-card {
  opacity: 0.55;
  border-style: dashed !important;
  transition: opacity 0.15s ease;
}
.fossil-card:hover {
  opacity: 0.75;
}
.stratum-recent { opacity: 0.78; }
.stratum-mid { opacity: 0.55; padding-left: 8px; }
.stratum-deep { opacity: 0.38; padding-left: 16px; }
</style>
