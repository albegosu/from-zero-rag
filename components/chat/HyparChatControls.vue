<script setup lang="ts">
import type { SearchMode } from '~/composables/useHyparChat'

const selectedSearchMode = defineModel<SearchMode>('searchMode', { required: true })
const selectedModel = defineModel<string>('model', { required: true })

defineProps<{
  llmProvider?: string
  modelOptions: Array<{ id: string; name: string; provider: string }>
  showModelSelector: boolean
}>()

const searchModeMenuOpen = ref(false)
const searchModeRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (searchModeRef.value && !searchModeRef.value.contains(e.target as Node)) {
    searchModeMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

const SEARCH_MODES: { value: SearchMode; label: string; description: string }[] = [
  { value: 'auto', label: 'auto', description: 'agent decides when to search' },
  { value: 'search', label: 'search', description: 'always search the knowledge base' },
  { value: 'direct', label: 'direct', description: 'skip KB, answer from model' },
]

function selectSearchMode(mode: SearchMode) {
  selectedSearchMode.value = mode
  searchModeMenuOpen.value = false
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div ref="searchModeRef" class="relative">
      <button
        type="button"
        class="font-mono text-[10px] flex items-center gap-1 cursor-pointer select-none wz-faint hover:wz-accent"
        :class="selectedSearchMode !== 'auto' ? 'wz-accent' : ''"
        :title="`search mode: ${selectedSearchMode}`"
        @click="searchModeMenuOpen = !searchModeMenuOpen"
      >
        <span class="opacity-50">mode/</span>
        <span>{{ selectedSearchMode }}</span>
        <span class="opacity-50">▾</span>
      </button>
      <div
        v-if="searchModeMenuOpen"
        class="absolute bottom-full right-0 mb-2 w-56 z-10 rounded border border-[color:var(--term-accent-line)] bg-[color:var(--term-bg)] shadow-xl"
      >
        <div class="px-3 py-1.5 text-[9px] wz-faint uppercase tracking-widest border-b border-[color:var(--term-accent-line)]">// search mode</div>
        <button
          v-for="m in SEARCH_MODES"
          :key="m.value"
          type="button"
          class="w-full text-left px-3 py-2 flex flex-col gap-0.5"
          :class="m.value === selectedSearchMode
            ? 'wz-accent bg-[color:var(--term-accent-soft)]'
            : 'hover:bg-[color:var(--term-accent-soft)]'"
          @click="selectSearchMode(m.value)"
        >
          <div class="flex items-center justify-between">
            <span class="font-mono text-[11px]">{{ m.label }}</span>
            <span v-if="m.value === selectedSearchMode" class="text-[9px] opacity-40">✓</span>
          </div>
          <span class="text-[9px] wz-faint opacity-60">{{ m.description }}</span>
        </button>
      </div>
    </div>

    <AiModelSelector
      v-if="showModelSelector"
      v-model="selectedModel"
      :models="modelOptions"
      :group-by-provider="false"
    >
      <template #trigger="{ selected, toggle, isOpen }">
        <button
          type="button"
          class="font-mono text-[10px] flex items-center gap-1 cursor-pointer select-none wz-faint hover:wz-accent"
          :title="`${llmProvider} · click to change model`"
          @click.stop="toggle"
        >
          <span class="opacity-50">{{ llmProvider }}/</span>
          <span>{{ selected?.name ?? selectedModel }}</span>
          <span class="opacity-50">▾</span>
        </button>
      </template>
      <template #option="{ model, selected }">
        <span
          class="w-full text-left px-3 py-1.5 text-[11px] font-mono flex items-center justify-between"
          :class="selected ? 'wz-accent' : ''"
        >
          <span class="truncate">{{ model.name }}</span>
          <span v-if="selected" class="text-[9px] opacity-40 ml-2 shrink-0">✓</span>
        </span>
      </template>
    </AiModelSelector>
  </div>
</template>
