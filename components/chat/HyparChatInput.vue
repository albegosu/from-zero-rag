<script setup lang="ts">
const input = defineModel<string>({ required: true })

const props = defineProps<{
  isBusy: boolean
  showCommandHelp: boolean
  filteredCommands: Array<{ name: string; description: string; hasArgs: boolean }>
  selectedCommandIdx: number
  hasMessages: boolean
}>()

const emit = defineEmits<{
  send: []
  stop: []
  clear: []
  selectCommand: [cmd: { name: string; hasArgs: boolean }]
  keydown: [event: KeyboardEvent]
}>()

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const promptRef = ref<{ focus: () => void; textareaRef: HTMLTextAreaElement | null } | null>(null)

defineExpose({
  focus: () => promptRef.value?.focus(),
})
</script>

<template>
  <div class="shrink-0 space-y-2 glass hairline-t pb-safe">
    <div class="wz-panel px-3 py-2">
      <AiPromptInput
        ref="promptRef"
        v-model="input"
        :placeholder="t('chat.placeholder')"
        :loading="isBusy"
        :disabled="isBusy"
        :rows="1"
        @submit="emit('send')"
        @stop="emit('stop')"
        @keydown="emit('keydown', $event)"
      >
        <template #prefix>
          <span class="wz-accent text-sm select-none shrink-0">&gt;</span>
        </template>
        <template #input="{ value, placeholder, disabled, loading, handleInput, handleKeydown }">
          <textarea
            :value="value"
            :placeholder="placeholder"
            :disabled="disabled || loading"
            rows="1"
            class="wz-input flex-1 border-0 bg-transparent !p-0 focus:!shadow-none min-h-[1.5rem] resize-none"
            style="background: transparent; border: 0;"
            autocomplete="off"
            @input="handleInput"
            @keydown="(e: KeyboardEvent) => { emit('keydown', e); if (!e.defaultPrevented) handleKeydown(e) }"
          />
        </template>
        <template #actions="{ loading, canSubmit, submit, stop }">
          <button
            v-if="loading"
            type="button"
            class="wz-btn-ghost text-xs shrink-0"
            @click="stop"
          >
            ✕ stop
          </button>
          <button
            v-else
            type="button"
            class="wz-btn-primary text-xs shrink-0"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{ t('chat.send') }} ▶
          </button>
        </template>
      </AiPromptInput>
    </div>

    <div
      v-if="showCommandHelp && filteredCommands.length"
      class="wz-panel px-3 py-2 space-y-1 text-[11px]"
    >
      <div class="wz-faint mb-1">
        {{ t('chat.commandsAvailable') }}
      </div>
      <div
        v-for="(cmd, idx) in filteredCommands"
        :key="cmd.name"
        class="flex flex-col cursor-pointer px-1 py-0.5 rounded select-none"
        :class="idx === selectedCommandIdx ? 'bg-[color:var(--term-accent-line)] text-[color:var(--term-fg)]' : 'hover:bg-[color:var(--term-accent-line)]/40'"
        @click="emit('selectCommand', cmd)"
      >
        <span class="wz-accent font-mono">{{ cmd.name }}</span>
        <span class="wz-muted">{{ cmd.description }}</span>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <button
        v-if="hasMessages"
        type="button"
        class="wz-btn-ghost text-[10px]"
        @click="emit('clear')"
      >
        ✕ {{ t('chat.clear') }}
      </button>
      <span v-else />
      <slot name="controls" />
    </div>
  </div>
</template>
