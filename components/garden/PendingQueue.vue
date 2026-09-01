<script setup lang="ts">
import type { AiQueueItem } from 'ai-elements-nuxt/types'
import { useEmbryoStore } from '~/stores/embryos'
import { truncateSeed } from '~/utils/embryo-display'

const store = useEmbryoStore()

interface PendingItem extends AiQueueItem {
  embryoId: string
}

const items = computed<PendingItem[]>(() => {
  const list: PendingItem[] = []
  for (const e of store.embryos) {
    if (e.state === 'FOSSIL') continue
    const notes = e.agentNotes.filter(n => n.type === 'PENDING_QUESTION' && !n.dismissed)
    for (const note of notes) {
      list.push({
        id: `${e.id}::${note.id}`,
        embryoId: e.id,
        content: `${truncateSeed(e.seed, 36)} — ${truncateSeed(note.content, 64)}`,
        status: 'queued',
        createdAt: note.createdAt,
      })
    }
  }
  return list.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
})

function openItem(item: AiQueueItem) {
  const embryoId = item.id.split('::')[0]
  if (embryoId) navigateTo(`/embryo/${embryoId}`)
}
</script>

<template>
  <div v-if="items.length" class="wz-panel">
    <div class="wz-panel-header flex items-center justify-between">
      <span class="wz-label">Pending challenges</span>
      <span class="wz-faint text-[10px]">{{ items.length }} unanswered</span>
    </div>
    <div class="p-3">
      <AiQueue :items="items" @retry="openItem">
        <template #item="{ item }">
          <button
            type="button"
            class="w-full text-left px-2 py-1.5 text-xs hover:bg-[var(--term-accent-soft)] transition-colors"
            @click="openItem(item)"
          >
            <span class="wz-accent mr-2">↯</span>
            <span class="wz-strong">{{ item.content }}</span>
          </button>
        </template>
      </AiQueue>
    </div>
  </div>
</template>
