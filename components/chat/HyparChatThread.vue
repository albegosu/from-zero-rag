<script setup lang="ts">
import type { HyparDisplayMessage } from '~/composables/useHyparChatDisplay'
import type { SearchParamsConfig } from '~/composables/useSearchParams'
import type { AiSuggestion } from '#ai-elements/types'

const props = defineProps<{
  messages: HyparDisplayMessage[]
  expandedSet: Set<number>
  searchParams: SearchParamsConfig | null
  isWaiting: boolean
  isSearching: boolean
  isLoading: boolean
  emptySuggestions: AiSuggestion[]
  visibleError: boolean
  errorMessage: string
  isAppRateLimit: boolean
  isProviderQuota: boolean
}>()

const emit = defineEmits<{
  toggleExpand: [index: number]
  dismissError: []
  suggestionSelect: [suggestion: AiSuggestion]
}>()

const scrollRef = ref<HTMLElement | null>(null)
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineExpose({ scrollRef })

function isExpanded(idx: number) {
  return props.expandedSet.has(idx)
}
</script>

<template>
  <div
    ref="scrollRef"
    class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-6 scroll-pb-4 hypar-chat-thread"
  >
    <div v-if="isLoading" class="wz-panel p-4">
      <AiShimmer :active="true" :lines="4" />
    </div>

    <div v-else-if="!messages.length" class="wz-panel p-6 text-center text-sm space-y-4">
      <div class="text-2xl mb-2">▌</div>
      <p class="wz-muted">{{ t('chat.empty') }}</p>
      <AiSuggestion
        :suggestions="emptySuggestions"
        @select="emit('suggestionSelect', $event)"
      />
    </div>

    <ChatHyparChatMessage
      v-for="(msg, idx) in messages"
      :key="msg.id"
      :msg="msg"
      :index="idx"
      :expanded="isExpanded(idx)"
      :search-params="searchParams"
      @toggle-expand="emit('toggleExpand', $event)"
    />

    <div v-if="isWaiting" class="flex justify-start" role="status" aria-live="polite">
      <div data-ai-message data-role="assistant" class="bubble-assistant">
        <span class="inline-flex gap-1 mr-2">
          <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: var(--term-accent)" />
          <span class="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:120ms]" style="background: var(--term-accent)" />
          <span class="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:240ms]" style="background: var(--term-accent)" />
        </span>
        <span class="wz-muted text-sm">{{ isSearching ? t('chat.searching') : t('chat.thinking') }}</span>
      </div>
    </div>

    <div v-if="visibleError" class="flex justify-start">
      <div
        data-ai-error-boundary
        data-has-error
        role="alert"
        class="bubble-assistant rounded-md px-3 py-2 text-sm space-y-1 max-w-[90%]"
        style="border-color: var(--term-error, #f87171);"
      >
        <div class="flex items-center gap-2 font-mono text-[11px]" style="color: var(--term-danger, #f87171);">
          <span>⚠</span>
          <span>{{ t('chat.errorTitle') }}</span>
          <button type="button" class="ml-auto wz-btn-ghost text-[11px]" @click="emit('dismissError')">✕</button>
        </div>
        <p data-ai-error-boundary-message class="wz-muted text-xs">{{ errorMessage }}</p>
        <NuxtLink
          v-if="isAppRateLimit"
          to="/settings?reason=ratelimit"
          class="inline-block text-[11px] wz-accent underline"
          @click="emit('dismissError')"
        >{{ t('chat.errorAppRateLimitCta') }} →</NuxtLink>
        <a
          v-else-if="isProviderQuota"
          href="https://ai.dev/rate-limit"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block text-[11px] wz-accent underline"
          @click="emit('dismissError')"
        >{{ t('chat.errorProviderQuotaCta') }} →</a>
      </div>
    </div>
  </div>
</template>
