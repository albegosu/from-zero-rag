<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <section class="wz-panel mb-5">
      <div class="wz-panel-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="wz-accent">$</span>
          <span class="wz-label">ls --documents</span>
        </div>
        <span class="wz-faint text-[11px]">{{ store.documents.length }} entries</span>
      </div>
      <div class="p-4 flex items-end justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold wz-strong">// {{ t('documents.title') }}</h1>
          <p class="wz-muted text-xs mt-1">{{ t('documents.count', { n: store.documents.length }) }}</p>
        </div>
        <NuxtLink to="/upload" class="wz-btn-primary text-xs whitespace-nowrap">
          + {{ t('documents.addNew') }}
        </NuxtLink>
      </div>
    </section>

    <div class="mb-5">
      <input
        v-model="searchTerm"
        type="text"
        class="wz-input"
        :placeholder="t('documents.search')"
      >
    </div>

    <div v-if="store.loading" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="wz-panel h-20 animate-pulse"
        style="background: var(--term-accent-soft)"
      />
    </div>

    <div v-else-if="filteredDocuments.length" class="space-y-2">
      <div
        v-for="doc in filteredDocuments"
        :key="doc.id"
        class="wz-panel card-hover cursor-pointer p-3 flex items-start gap-3"
        @click="navigateTo(`/documents/${doc.id}`)"
      >
        <div class="w-9 h-9 shrink-0 rounded-md flex items-center justify-center" style="background: var(--term-accent-soft); border: 1px solid var(--term-accent-line)">
          <UIcon
            :name="getIconForType(doc.sourceType)"
            class="w-4 h-4 wz-accent"
          />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold wz-strong truncate">{{ doc.title }}</h3>
          <p class="text-sm wz-muted mt-1 line-clamp-2">{{ doc.content.slice(0, 140) }}…</p>
          <div class="flex items-center gap-3 mt-2 text-xs wz-faint">
            <span class="wz-pill">
              {{ doc._count?.chunks || 0 }} {{ t('documents.chunks') }}
            </span>
            <span>{{ formatDate(doc.createdAt) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            class="wz-btn-danger text-xs"
            :disabled="deletingId === doc.id"
            @click.stop="onDelete(doc)"
          >
            {{ deletingId === doc.id ? '…' : '✕' }}
          </button>
          <span class="wz-faint">→</span>
        </div>
      </div>
    </div>

    <div v-else class="wz-panel text-center py-12 px-6">
      <div class="flex justify-center mb-3 opacity-85" style="color: var(--term-accent-strong)">
        <MicroGlyph name="inbox" decorative class="w-10! h-10!" />
      </div>
      <h3 class="text-base font-semibold wz-strong mb-1">{{ t('documents.empty') }}</h3>
      <p class="wz-muted text-sm mb-4">{{ t('documents.emptyHint') }}</p>
      <NuxtLink to="/upload" class="wz-btn-primary text-xs inline-block">
        {{ t('documents.uploadCta') }} ▶
      </NuxtLink>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('documents.delete')"
      :message="pendingDeleteDoc ? t('documents.confirmDelete', { title: pendingDeleteDoc.title }) : ''"
      :confirm-text="t('documents.delete')"
      :cancel-text="t('common.cancel')"
      :loading="deletingId === pendingDeleteDoc?.id"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

useHead({ title: 'Documents - hypar' })
const { t } = useI18n()
const store = useDocumentsStore()
const toast = useToast()
const searchTerm = ref('')
const deletingId = ref(null)
const showDeleteModal = ref(false)
const pendingDeleteDoc = ref(null)

onMounted(() => {
  store.fetchDocuments()
})

const filteredDocuments = computed(() => {
  if (!searchTerm.value) return store.documents
  const term = searchTerm.value.toLowerCase()
  return store.documents.filter(doc =>
    doc.title.toLowerCase().includes(term) ||
    doc.content.toLowerCase().includes(term)
  )
})

async function onDelete(doc) {
  pendingDeleteDoc.value = doc
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!pendingDeleteDoc.value) return
  deletingId.value = pendingDeleteDoc.value.id
  try {
    await store.deleteDocument(pendingDeleteDoc.value.id)
    toast.add({ title: t('documents.deleted') })
    showDeleteModal.value = false
    pendingDeleteDoc.value = null
  } catch (err) {
    toast.add({ title: t('documents.deleteFailed'), description: err?.message ?? '', color: 'red' })
  } finally {
    deletingId.value = null
  }
}

function getIconForType(type) {
  const icons = {
    text: 'i-heroicons-document-text',
    markdown: 'i-heroicons-document',
    pdf: 'i-heroicons-document-arrow-down',
    web: 'i-heroicons-globe-alt',
    spreadsheet: 'i-heroicons-table-cells',
  }
  return icons[type] || 'i-heroicons-document'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>
