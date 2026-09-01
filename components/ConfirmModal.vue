<template>
  <Teleport to="body">
    <Transition name="wz-confirm">
      <div
        v-if="modelValue"
        class="terminal-theme fixed inset-0 z-200 flex items-center justify-center px-4 py-10 sm:py-12"
        :class="{ 'theme-light': theme === 'light' }"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="wz-confirm-overlay absolute inset-0"
          aria-label="Close dialog"
          @click="onCancel"
        />

        <div class="relative z-10 w-full max-w-md">
          <div class="wz-panel card-hover overflow-hidden shadow-lg">
            <div class="wz-panel-header flex items-center gap-2">
              <span class="wz-label truncate">{{ title }}</span>
            </div>

            <div class="p-6 sm:p-7">
              <p class="wz-muted text-sm leading-relaxed wrap-break-word">
                {{ message }}
              </p>

              <div class="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5">
                <button
                  type="button"
                  class="wz-btn-ghost w-full sm:w-auto sm:min-w-28 justify-center text-xs py-2.5 sm:py-2"
                  :disabled="loading"
                  @click="onCancel"
                >
                  {{ cancelText }}
                </button>
                <button
                  type="button"
                  class="wz-btn-danger flex-1 justify-center text-xs py-2.5 sm:py-2"
                  :disabled="loading"
                  @click="$emit('confirm')"
                >
                  {{ loading ? '…' : confirmText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { theme } = useTerminalPrefs()

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

function onCancel() {
  if (props.loading) return
  emit('update:modelValue', false)
}
</script>

<style scoped>
.wz-confirm-overlay {
  background: color-mix(in srgb, var(--term-bg) 40%, #000);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.terminal-theme.theme-light .wz-confirm-overlay {
  background: color-mix(in srgb, var(--term-bg) 65%, #6b6b6b);
}

.wz-confirm-enter-active,
.wz-confirm-leave-active {
  transition: opacity 0.22s ease;
}

.wz-confirm-enter-active .wz-panel,
.wz-confirm-leave-active .wz-panel {
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s ease;
}

.wz-confirm-enter-from,
.wz-confirm-leave-to {
  opacity: 0;
}

.wz-confirm-enter-from .wz-panel,
.wz-confirm-leave-to .wz-panel {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
