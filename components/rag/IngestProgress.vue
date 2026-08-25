<template>
  <div class="wz-panel">
    <div class="wz-panel-header flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="wz-accent">$</span>
        <span class="wz-label">ingest --pipeline --doc {{ documentId.slice(0, 8) }}</span>
      </div>
      <span class="wz-faint text-[11px] font-mono">{{ elapsedDisplay }}</span>
    </div>

    <div class="p-3 space-y-3">

      <!-- Step 0: text extracted -->
      <div class="space-y-0.5">
        <RagPipelineStepRow
          :status="stepStatus(0)"
          label="TEXT EXTRACTED"
          :detail="stepStatus(0) === 'done' ? 'raw text · ready to split' : undefined"
        />
        <p v-if="stepStatus(0) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          reading file content and extracting plain text
        </p>
      </div>

      <!-- Step 1: chunking -->
      <div class="space-y-0.5">
        <RagPipelineStepRow
          :status="stepStatus(1)"
          label="CHUNKING"
          :detail="chunkDetail"
        />
        <p v-if="stepStatus(1) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          sentence-aware · target {{ chunkSize }} tokens/chunk · {{ chunkOverlap }} overlap
        </p>
        <p v-if="stepStatus(1) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          splitting without breaking sentences so each chunk stays coherent
        </p>
      </div>

      <!-- Step 2: embedding -->
      <div class="space-y-0.5">
        <RagPipelineStepRow
          :status="stepStatus(2)"
          label="EMBEDDING"
          :detail="embedDetail"
        />
        <p v-if="stepStatus(2) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          {{ embeddingDims }}-dim · provider: {{ embeddingProvider }}
        </p>
        <p v-if="stepStatus(2) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          each chunk → a vector that captures its semantic meaning
        </p>
      </div>

      <!-- Step 3: persist -->
      <div class="space-y-0.5">
        <RagPipelineStepRow
          :status="stepStatus(3)"
          label="PERSIST → pgvector"
          :detail="stepStatus(3) === 'done' ? 'HNSW index · cosine distance' : undefined"
        />
        <p v-if="stepStatus(3) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          writing vectors to postgresql · cosine similarity index
        </p>
        <p v-if="stepStatus(3) === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          pgvector stores embeddings as native vector type for fast ANN search
        </p>
      </div>

      <!-- Step 4: ready -->
      <div class="space-y-0.5">
        <RagPipelineStepRow
          :status="finalStep"
          label="MARK READY"
          :detail="finalDetail"
        />
        <p v-if="finalStep === 'active'" class="ml-7 text-[11px] wz-faint font-mono">
          marking document as searchable in the knowledge base
        </p>
      </div>

      <!-- Summary on completion -->
      <div
        v-if="finalStatus === 'ready'"
        class="mt-1 pt-2 border-t font-mono text-[11px] space-y-0.5"
        style="border-color: var(--term-accent-faint)"
      >
        <div class="wz-accent">// ingestion complete</div>
        <div class="wz-faint">{{ chunkCount }} chunks · {{ embeddingDims }}-dim vectors · ready for retrieval</div>
        <div class="wz-faint">total time: {{ elapsedDisplay }}</div>
      </div>

      <!-- Error -->
      <div
        v-if="finalStatus === 'failed'"
        class="mt-1 pt-2 border-t text-[11px] font-mono"
        style="border-color: var(--term-accent-faint); color: var(--term-error, #f87171)"
      >
        ✗ {{ errorMessage ?? 'ingestion failed' }}
      </div>

      <!-- Progress indicator -->
      <div class="pt-1 font-mono text-[11px] wz-faint flex items-center justify-between">
        <span>step {{ Math.min(currentStep + 1, 5) }}/5</span>
        <span v-if="finalStatus === 'polling'">
          <span class="wz-accent animate-pulse">▌</span> processing
        </span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  documentId: string
  runId: string
}>()

const emit = defineEmits<{
  complete: [chunkCount: number]
  failed: [error: string | null]
}>()

const docId = toRef(props, 'documentId')
const runIdRef = toRef(props, 'runId')

const { currentStep, elapsedMs, chunkCount, finalStatus, errorMessage, start } =
  useIngestProgress(docId, runIdRef)

// Config values from search-params endpoint
const embeddingDims = ref(768)
const embeddingProvider = ref('—')
const llmProvider = ref('—')
const chunkSize = ref(400)
const chunkOverlap = ref(60)

onMounted(() => {
  start()
  useSearchParams().then((p) => {
    embeddingDims.value = p.embeddingDims
    embeddingProvider.value = p.embeddingProvider ?? p.llmProvider
    llmProvider.value = p.llmProvider
  }).catch(() => {})
})

// Pause 2.5s after completion so user can read the summary before parent dismisses
watch(finalStatus, (s) => {
  if (s === 'ready') {
    setTimeout(() => emit('complete', chunkCount.value), 2500)
  }
  if (s === 'failed') emit('failed', errorMessage.value)
})

const elapsedDisplay = computed(() => {
  const s = (elapsedMs.value / 1000).toFixed(1)
  return `elapsed: ${s}s`
})

function stepStatus(step: number): 'pending' | 'active' | 'done' | 'error' {
  if (finalStatus.value === 'ready') return 'done'
  if (finalStatus.value === 'failed') return step <= currentStep.value ? 'done' : 'pending'
  if (currentStep.value > step) return 'done'
  if (currentStep.value === step) return 'active'
  return 'pending'
}

const finalStep = computed<'pending' | 'active' | 'done' | 'error'>(() => {
  if (finalStatus.value === 'ready') return 'done'
  if (finalStatus.value === 'failed') return 'error'
  if (currentStep.value === 4) return 'active'
  return 'pending'
})

const chunkDetail = computed(() => {
  if (finalStatus.value === 'ready' && chunkCount.value > 0)
    return `${chunkCount.value} chunks · sentence-aware · ~${chunkSize.value} tokens · ${chunkOverlap.value} overlap`
  if (currentStep.value > 1) return 'done'
  return undefined
})

const embedDetail = computed(() => {
  if (currentStep.value > 2 || finalStatus.value === 'ready')
    return `${embeddingDims.value}-dim · provider: ${embeddingProvider.value}`
  return undefined
})

const finalDetail = computed(() => {
  if (finalStatus.value === 'ready') return `${chunkCount.value} vectors indexed · searchable`
  return undefined
})
</script>
