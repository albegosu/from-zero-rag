<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiConversationThread } from '#ai-elements/types'

const props = withDefaults(defineProps<{
  threads?: AiConversationThread[]
  activeId: string | null
  documents?: Array<{ id: string; title: string; sourceType: string; _count?: { chunks?: number } }>
  documentsLoading: boolean
}>(), {
  threads: () => [],
  documents: () => [],
})

const safeThreads = computed(() => props.threads ?? [])

const emit = defineEmits<{
  selectConversation: [id: string]
  newConversation: []
  deleteConversation: [id: string]
  openDocument: [id: string]
}>()

const { t } = useI18n()

function getIconForType(type: string) {
  const icons: Record<string, string> = {
    text: 'i-heroicons-document-text',
    markdown: 'i-heroicons-document',
    pdf: 'i-heroicons-document-arrow-down',
    web: 'i-heroicons-globe-alt',
  }
  return icons[type] || 'i-heroicons-document'
}
</script>

<template>
  <section
    class="mt-4 pt-4 hairline-t min-h-0 flex flex-col flex-[2] gap-4 lg:flex-none lg:flex-col lg:gap-6 lg:mt-0 lg:pt-0 lg:pl-6 lg:border-t-0 lg:w-80 w-full"
  >
    <div class="flex flex-col min-h-0 flex-1 basis-0 lg:flex-[1_1_0]">
      <AiConversation
        :threads="[...safeThreads]"
        :active-id="activeId ?? undefined"
        @select="(thread: AiConversationThread) => emit('selectConversation', thread.id)"
        @create="emit('newConversation')"
        @delete="(thread: AiConversationThread) => emit('deleteConversation', thread.id)"
      >
        <template #header>
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h2 class="text-[10px] uppercase tracking-widest wz-label">
              // {{ t('chat.conversations') }}
            </h2>
            <button type="button" class="wz-btn-ghost text-[10px]" @click="emit('newConversation')">
              {{ t('chat.newConversation') }}
            </button>
          </div>
        </template>
        <template v-if="safeThreads.length" #default="{ threads: list }">
          <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 pr-0.5">
            <div
              v-for="thread in list"
              :key="thread.id"
              class="wz-panel p-2 flex items-center gap-2 cursor-pointer card-hover"
              :class="{ 'wz-pill': thread.id === activeId }"
              @click="emit('selectConversation', thread.id)"
            >
              <div class="flex-1 min-w-0">
                <div class="text-xs wz-strong truncate">{{ thread.title }}</div>
                <div class="text-[10px] wz-faint">{{ thread.messageCount }} msg</div>
              </div>
              <button
                type="button"
                class="wz-btn-ghost text-[10px]"
                :title="t('chat.deleteTitle')"
                @click.stop="emit('deleteConversation', thread.id)"
              >✕</button>
            </div>
          </div>
        </template>
        <template v-else #footer>
          <div class="text-xs wz-faint shrink-0">{{ t('chat.noConversations') }}</div>
        </template>
      </AiConversation>
    </div>

    <div class="flex flex-col min-h-0 flex-1 basis-0 lg:flex-[1_1_0]">
      <h2 class="text-[10px] uppercase tracking-widest wz-label mb-3 shrink-0">
        // {{ t('chat.recentDocs') }}
      </h2>
      <div
        v-if="documentsLoading"
        class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-0.5"
      >
        <AiShimmer :active="true" :lines="3" />
      </div>
      <div
        v-else-if="props.documents.length"
        class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-0.5"
      >
        <button
          v-for="doc in documents.slice(0, 5)"
          :key="doc.id"
          type="button"
          class="wz-panel card-hover cursor-pointer w-full text-left p-3 flex items-center gap-3"
          @click="emit('openDocument', doc.id)"
        >
          <div class="w-8 h-8 shrink-0 rounded-md flex items-center justify-center" style="background: var(--term-accent-soft); border: 1px solid var(--term-accent-line)">
            <UIcon
              :name="getIconForType(doc.sourceType)"
              class="w-4 h-4 wz-accent"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-medium text-sm truncate wz-strong">{{ doc.title }}</h3>
            <p class="text-xs wz-faint">{{ doc._count?.chunks || 0 }} {{ t('chat.chunks') }}</p>
          </div>
          <span class="wz-faint">→</span>
        </button>
      </div>
      <div v-else class="text-center py-6 text-sm wz-muted shrink-0">
        <p>{{ t('chat.noDocs') }}</p>
        <NuxtLink to="/upload" class="wz-btn-primary text-xs mt-2 inline-block">
          {{ t('chat.uploadCta') }} ▶
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
