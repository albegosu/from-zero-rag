<template>
  <div class="mt-2 pt-2 border-t" style="border-color: var(--term-accent-faint)">
    <button
      type="button"
      class="wz-btn-ghost text-[11px] inline-flex items-center gap-1 w-full justify-between"
      @click="open = !open"
    >
      <span class="font-mono wz-label">// QUERY PIPELINE</span>
      <UIcon
        name="i-heroicons-chevron-down"
        class="w-3 h-3 transition-transform shrink-0"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div v-if="open" class="mt-2 space-y-3 font-mono text-[11px]">
      <!-- Steps -->
      <div class="space-y-1">
        <RagPipelineStepRow
          status="done"
          label="EMBEDDING"
          :detail="`${params.embeddingDims}-dim vector`"
        />
        <RagPipelineStepRow
          status="done"
          label="VECTOR SEARCH"
          :detail="`cosine similarity · top-${fetchLimit} candidates`"
        />
        <RagPipelineStepRow
          v-if="params.hybridEnabled"
          status="done"
          label="BM25 SEARCH"
          :detail="`keyword matching · top-${fetchLimit} candidates`"
        />
        <RagPipelineStepRow
          v-if="params.hybridEnabled"
          status="done"
          label="HYBRID MERGE"
          :detail="`α=${params.hybridAlpha.toFixed(1)} vector + ${(1 - params.hybridAlpha).toFixed(1)} BM25`"
        />
        <RagPipelineStepRow
          v-if="params.rerankEnabled"
          status="done"
          label="MMR RANKING"
          :detail="`λ=${params.mmrLambda} · diversity filter`"
        />
        <RagPipelineStepRow
          status="done"
          label="THRESHOLD"
          :detail="`min score ${params.minScore} · ${sources.length} chunks passed`"
        />
      </div>

      <!-- Separator -->
      <div class="wz-faint text-[11px]">{{ separator }}</div>

      <!-- Retrieved chunks with score bars -->
      <div v-if="sources.length" class="space-y-1.5">
        <div
          v-for="s in sources"
          :key="s.chunkId"
          class="flex items-baseline gap-2"
        >
          <span class="wz-accent shrink-0">{{ scoreBar(s.score) }} {{ s.score.toFixed(3) }}</span>
          <NuxtLink
            :to="`/documents/${s.documentId}`"
            class="wz-faint hover:wz-accent transition-colors truncate"
          >{{ s.documentTitle }}</NuxtLink>
        </div>
      </div>

      <!-- Separator -->
      <div class="wz-faint text-[11px]">{{ separator }}</div>

      <!-- LLM step -->
      <RagPipelineStepRow
        status="done"
        label="LLM GENERATION"
        :detail="llmDetail"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchParamsConfig } from '~/composables/useSearchParams'

interface Source {
  chunkId: string
  documentId: string
  documentTitle: string
  score: number
}

const props = defineProps<{
  sources: Source[]
  params: SearchParamsConfig
  latencyMs?: number
}>()

const open = ref(false)

const separator = '─'.repeat(42)

// Mirrors server/utils/search.service.ts: fetchLimit = max(topK * overFetch, topK + 5)
const fetchLimit = computed(() =>
  Math.max(props.params.topK * (props.params.overFetch ?? 3), props.params.topK + 5),
)

function scoreBar(score: number): string {
  const filled = Math.round(score * 5)
  const blocks = ['░', '▒', '▓', '█']
  return Array.from({ length: 5 }, (_, i) => {
    const level = Math.min(3, Math.round((filled - i) * 3))
    return level >= 3 ? '█' : level === 2 ? '▓' : level === 1 ? '▒' : '░'
  }).join('')
}

const llmDetail = computed(() => {
  const parts = [props.params.llmModel, 'streaming']
  if (props.latencyMs) parts.splice(1, 0, `${props.latencyMs}ms`)
  return parts.join(' · ')
})
</script>
