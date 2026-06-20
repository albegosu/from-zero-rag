<script setup lang="ts">
import type { HyparDisplayMessage } from '~/composables/useHyparChatDisplay'
import type { SearchParamsConfig } from '~/composables/useSearchParams'

defineProps<{
  msg: HyparDisplayMessage
  index: number
  expanded: boolean
  searchParams: SearchParamsConfig | null
}>()

const emit = defineEmits<{
  toggleExpand: [index: number]
}>()

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div
    class="flex min-w-0 w-full"
    :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div class="max-w-[90%] min-w-0 flex flex-col gap-1">
      <AiMessage v-bind="msg.aiProps">
        <template v-if="msg.role === 'user'" #content>
          <div class="wz-faint text-[10px] mb-1 font-mono space-y-0.5">
            <div>&gt; user</div>
            <div v-if="msg.userMetrics" class="flex flex-wrap gap-x-2 gap-y-0.5">
              <span>{{ t('chat.userMetricsMode', { mode: msg.userMetrics.searchMode }) }}</span>
              <span>{{ t('chat.userMetricsDocs', { count: msg.userMetrics.docsCount }) }}</span>
              <span>{{ t('chat.userMetricsChars', { count: msg.userMetrics.charCount }) }}</span>
            </div>
            <div
              v-if="msg.userMetrics?.inputTokens != null || msg.userMetrics?.outputTokens != null"
              class="wz-faint"
            >
              <span v-if="msg.userMetrics.inputTokens != null">
                {{ t('chat.userMetricsTokensIn', { count: msg.userMetrics.inputTokens }) }}
              </span>
              <span v-if="msg.userMetrics.outputTokens != null">
                <template v-if="msg.userMetrics.inputTokens != null"> · </template>
                {{ t('chat.userMetricsTokensOut', { count: msg.userMetrics.outputTokens }) }}
              </span>
            </div>
          </div>
          {{ msg.text }}
        </template>

        <template v-else-if="msg.role === 'assistant'" #tool-calls="{ toolCalls }">
          <AiTool
            v-for="tc in toolCalls"
            :key="tc.id"
            :tool-call="tc"
          >
            <template #header="{ toolCall, statusLabel }">
              <div data-ai-tool-header class="flex items-center gap-2">
                <span data-ai-tool-name>{{ toolCall.name }}</span>
                <span class="wz-faint text-[10px]">{{ statusLabel }}</span>
              </div>
            </template>
          </AiTool>
        </template>

        <template v-if="msg.role === 'assistant'" #content="{ content, isStreaming: streaming }">
          <div class="wz-faint text-[10px] mb-1 font-mono flex items-center gap-2">
            <span>&lt; agent</span>
            <span v-if="msg.searched === true" class="wz-pill" :title="t('chat.searchedHint')">{{ t('chat.searched') }}</span>
            <span v-else-if="msg.searched === false" class="wz-pill wz-pill-dashed" :title="t('chat.notSearchedHint')">{{ t('chat.notSearched') }}</span>
            <span v-if="msg.cited" class="wz-pill" :title="t('chat.citedHint')">{{ t('chat.cited') }}</span>
          </div>
          <AiMarkdown :content="content" />
          <AiStreamingCursor v-if="streaming && content" :active="true" />
        </template>

        <template v-if="msg.role === 'assistant' && msg.aiProps.sources?.length" #sources="{ sources }">
          <div class="text-xs">
            <span class="wz-faint">{{ t('chat.sources') }}: </span>
            <AiSources :sources="sources">
              <template #default>
                <template
                  v-for="(s, i) in sources"
                  :key="s.id"
                >
                  <NuxtLink
                    v-if="s.url"
                    :to="s.url"
                    class="wz-accent hover:underline"
                  >{{ s.title }}</NuxtLink>
                  <span v-else>{{ s.title }}</span><span v-if="Number(i) < sources.length - 1">, </span>
                </template>
              </template>
            </AiSources>
          </div>
        </template>
      </AiMessage>

      <RagPipelineTrace
        v-if="msg.role === 'assistant' && msg.sources?.length && searchParams"
        :sources="msg.sources"
        :params="searchParams"
        :latency-ms="msg.latencyMs"
      />

      <div
        v-if="msg.role === 'assistant' && msg.results?.length"
        class="mt-1 pt-2 border-t"
        style="border-color: var(--term-accent-faint)"
      >
        <button
          type="button"
          class="wz-btn-ghost text-[11px] inline-flex items-center gap-1"
          @click="emit('toggleExpand', index)"
        >
          <UIcon
            name="i-heroicons-chevron-down"
            class="w-3 h-3 transition-transform"
            :class="expanded ? 'rotate-180' : ''"
          />
          {{ expanded ? t('chat.hideRetrieval') : t('chat.showRetrieval') }}
          ({{ msg.results.length }} {{ t('chat.chunks') }})
        </button>
        <div v-if="expanded" class="mt-2 space-y-1.5">
          <div
            v-for="(r, i) in msg.results"
            :key="r.chunkId"
            class="text-xs wz-panel p-2"
          >
            <div class="flex items-center justify-between text-[10px] wz-faint mb-1 font-mono">
              <span>#{{ i + 1 }} · {{ r.documentTitle }}</span>
              <span class="wz-accent">{{ t('chat.score') }} {{ r.score.toFixed(3) }}</span>
            </div>
            <p class="whitespace-pre-wrap wz-muted line-clamp-3">{{ r.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
