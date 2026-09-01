<script setup lang="ts">
import type { AiModelOption } from 'ai-elements-nuxt/types'

const { selectedModel, runtimeDefault } = useLlmModel()

const { data, pending, error, refresh } = await useFetch<{
  defaultModel: string
  models: AiModelOption[]
}>('/api/llm/models')

const models = computed<AiModelOption[]>(() => data.value?.models ?? [{
  id: runtimeDefault.value,
  name: runtimeDefault.value,
  provider: 'Ollama',
  description: 'configured default',
}])
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pt-6 pb-24 flex flex-col gap-5">
    <div class="wz-panel">
      <div class="wz-panel-header">
        <span class="wz-label">Settings</span>
      </div>
      <div class="p-4 flex flex-col gap-4">
        <div>
          <p class="text-[10px] wz-faint uppercase tracking-wider mb-2">collaborator model</p>
          <p class="text-xs wz-muted mb-3">
            used for the next agent turn. default from env is
            <span class="wz-strong">{{ runtimeDefault }}</span>.
          </p>
          <div v-if="pending" class="wz-faint text-[11px]">listing models...</div>
          <p v-else-if="error" class="text-[11px] text-[var(--term-danger)] mb-2">
            could not list Ollama models — using the configured default.
            <button type="button" class="underline" @click="refresh()">retry</button>
          </p>
          <AiModelSelector
            v-if="!pending"
            v-model="selectedModel"
            :models="models"
            :group-by-provider="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>
