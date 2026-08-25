<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="mb-4">
      <NuxtLink to="/" class="wz-btn-ghost text-xs">
        ← {{ t('nav.back') }}
      </NuxtLink>
    </div>

    <section class="wz-panel mb-6">
      <div class="wz-panel-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="wz-accent">$</span>
          <span class="wz-label">upload --document</span>
        </div>
      </div>
      <div class="p-4 flex items-start gap-3">
        <span class="mt-0.5 shrink-0 opacity-80 inline-flex text-(--term-accent-strong)">
          <MicroGlyph name="upload" decorative class="w-6! h-6!" />
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="text-lg font-semibold wz-strong">// {{ t('upload.title') }}</h1>
          <p class="wz-muted text-xs mt-1">{{ t('upload.subtitle') }}</p>
        </div>
      </div>
    </section>

    <!-- Ingestion progress — stays visible until user dismisses -->
    <div v-if="ingestDocumentId && ingestRunId" class="space-y-3">
      <RagIngestProgress
        :document-id="ingestDocumentId"
        :run-id="ingestRunId"
        @complete="onIngestComplete"
        @failed="onIngestFailed"
      />

      <!-- Action panel appears below the steps once complete -->
      <div v-if="uploadDone" class="wz-panel p-4 space-y-3">
        <div class="flex items-center gap-2 font-mono text-sm">
          <span class="wz-accent">[✓]</span>
          <span class="wz-strong">{{ t('upload.successTitle') }}</span>
        </div>
        <p class="wz-muted text-xs">{{ t('upload.successHint') }}</p>
        <div class="flex gap-2 pt-1">
          <NuxtLink :to="`/documents/${uploadedDocumentId}`" class="wz-btn-outline text-xs">
            {{ t('upload.successView') }} →
          </NuxtLink>
          <button type="button" class="wz-btn-ghost text-xs" @click="resetUpload">
            {{ t('upload.successAnother') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Form — hidden during ingestion -->
    <template v-if="!ingestDocumentId">
      <!-- Tabs -->
      <div class="flex items-center gap-1 mb-4 text-[11px]">
        <button
          type="button"
          class="px-3 py-1.5 rounded transition-colors"
          :class="activeTab === 0 ? 'wz-pill' : 'wz-faint hover:text-[color:var(--term-text-strong)]'"
          @click="activeTab = 0"
        >
          [● {{ t('upload.tabText') }}]
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded transition-colors"
          :class="activeTab === 1 ? 'wz-pill' : 'wz-faint hover:text-[color:var(--term-text-strong)]'"
          @click="activeTab = 1"
        >
          [● {{ t('upload.tabFile') }}]
        </button>
      </div>

      <!-- Text Input -->
      <div v-if="activeTab === 0" class="space-y-4">
        <div>
          <label class="wz-label text-[11px] uppercase tracking-widest">// {{ t('upload.fieldTitle') }}</label>
          <input
            v-model="form.title"
            type="text"
            class="wz-input mt-1"
            :placeholder="t('upload.fieldTitlePlaceholder')"
          >
        </div>

        <div>
          <label class="wz-label text-[11px] uppercase tracking-widest">// {{ t('upload.fieldContent') }}</label>
          <textarea
            v-model="form.content"
            class="wz-textarea mt-1"
            rows="12"
            :placeholder="t('upload.fieldContentPlaceholder')"
          />
        </div>

        <div>
          <label class="wz-label text-[11px] uppercase tracking-widest">// {{ t('upload.fieldType') }}</label>
          <select v-model="form.sourceType" class="wz-select mt-1">
            <option value="text">text</option>
            <option value="markdown">markdown</option>
          </select>
        </div>

        <div v-if="uploadError" class="wz-panel px-3 py-2 text-xs flex items-start gap-2" style="border-color: var(--term-error, #f87171);">
          <span style="color: var(--term-error, #f87171);">⚠</span>
          <span class="wz-muted flex-1">{{ uploadError }}</span>
          <button type="button" class="wz-btn-ghost text-[11px]" @click="uploadError = null">✕</button>
        </div>

        <button
          type="button"
          class="wz-btn-primary w-full justify-center"
          :disabled="!form.title || !form.content || uploading"
          @click="submitText"
        >
          {{ uploading ? '…' : `${t('upload.save')} ▶` }}
        </button>
      </div>

      <!-- File Upload -->
      <div v-else class="space-y-4">
        <div
          class="wz-panel p-8 text-center cursor-pointer transition-colors"
          style="border-style: dashed;"
          @click="fileInput?.click()"
        >
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-md mb-3" style="background: var(--term-accent-soft); border: 1px solid var(--term-accent-line)">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-6 h-6 wz-accent" />
          </div>
          <p class="wz-strong font-medium mb-1">{{ t('upload.dropZone') }}</p>
          <p class="text-sm wz-muted">{{ supportsLine }}</p>

          <input
            ref="fileInput"
            type="file"
            :accept="uploadAccept"
            class="hidden"
            @change="handleFileChange"
          >

          <button
            type="button"
            class="wz-btn-outline mt-4 text-xs"
            @click.stop="fileInput?.click()"
          >
            {{ t('upload.selectFile') }}
          </button>
        </div>

        <div v-if="selectedFile" class="wz-panel flex items-center gap-3 p-3">
          <div class="w-10 h-10 shrink-0 rounded-md flex items-center justify-center" style="background: var(--term-accent-soft); border: 1px solid var(--term-accent-line)">
            <UIcon name="i-heroicons-document" class="w-5 h-5 wz-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium wz-strong truncate">{{ selectedFile.name }}</p>
            <p class="text-sm wz-faint">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button type="button" class="wz-btn-ghost" @click="selectedFile = null">✕</button>
        </div>

        <div v-if="uploadError" class="wz-panel px-3 py-2 text-xs flex items-start gap-2" style="border-color: var(--term-error, #f87171);">
          <span style="color: var(--term-error, #f87171);">⚠</span>
          <span class="wz-muted flex-1">{{ uploadError }}</span>
          <button type="button" class="wz-btn-ghost text-[11px]" @click="uploadError = null">✕</button>
        </div>

        <button
          v-if="selectedFile"
          type="button"
          class="wz-btn-primary w-full justify-center"
          :disabled="uploading"
          @click="submitFile"
        >
          {{ uploadStatus || `${t('upload.uploadFile')} ▶` }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

useHead({ title: 'Upload - hypar' })
const { t } = useI18n()
const store = useDocumentsStore()

interface UploadConfig {
  allowedFormats: string[]
  accept: string
  supportsLabel: string
  maxDocSizeMb: number
}

const uploadConfig = ref<UploadConfig | null>(null)
const uploadAccept = computed(() => uploadConfig.value?.accept ?? '.txt,.md,.pdf,.xls,.xlsx')
const supportsLine = computed(() => {
  const label = uploadConfig.value?.supportsLabel ?? '.txt, .md, .pdf, .xls, .xlsx'
  return `${t('upload.supportsPrefix')} ${label}`
})

onMounted(async () => {
  try {
    uploadConfig.value = await $fetch<UploadConfig>('/api/config/upload')
  } catch {
    uploadConfig.value = null
  }
})

const activeTab = ref(0)
const uploading = ref(false)
const uploadStatus = ref('')
const uploadError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const ingestDocumentId = ref('')
const ingestRunId = ref('')
const uploadDone = ref(false)
const uploadedDocumentId = ref('')

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.statusMessage === 'string') return e.statusMessage
    if (typeof e.message === 'string') return e.message
  }
  return String(err) || 'Unknown error'
}

const form = reactive({
  title: '',
  content: '',
  sourceType: 'text',
})

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) selectedFile.value = file
}

async function submitText() {
  uploading.value = true
  uploadStatus.value = t('upload.saving')
  uploadError.value = null
  try {
    const { documentId, runId } = await store.createDocument({
      title: form.title,
      content: form.content,
      sourceType: form.sourceType,
    })
    ingestDocumentId.value = documentId
    ingestRunId.value = runId
  } catch (err) {
    uploadError.value = extractErrorMessage(err)
  } finally {
    uploading.value = false
    uploadStatus.value = ''
  }
}

async function submitFile() {
  if (!selectedFile.value) return
  uploading.value = true
  uploadStatus.value = t('upload.uploading')
  uploadError.value = null
  try {
    const { documentId, runId } = await store.uploadFile(selectedFile.value)
    ingestDocumentId.value = documentId
    ingestRunId.value = runId
  } catch (err) {
    uploadError.value = extractErrorMessage(err)
  } finally {
    uploading.value = false
    uploadStatus.value = ''
  }
}

function onIngestComplete() {
  uploadedDocumentId.value = ingestDocumentId.value
  uploadDone.value = true
  // ingestDocumentId stays set → IngestProgress remains mounted and readable
}

function onIngestFailed(error: string | null) {
  uploadError.value = error ?? t('upload.errorIngestion')
  ingestDocumentId.value = ''
  ingestRunId.value = ''
}

function resetUpload() {
  uploadDone.value = false
  ingestDocumentId.value = ''
  ingestRunId.value = ''
  selectedFile.value = null
  form.title = ''
  form.content = ''
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
