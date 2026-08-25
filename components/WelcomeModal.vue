<template>
  <Teleport to="body">
    <Transition name="wz-welcome">
      <div
        v-if="visible"
        class="terminal-theme fixed inset-0 z-[200] flex items-center justify-center px-4 py-10 sm:py-12"
        :class="{ 'theme-light': theme === 'light' }"
      >
        <div
          class="wz-welcome-overlay absolute inset-0"
          aria-hidden="true"
          @click="dismiss"
        />
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descId"
          class="relative z-10 w-full max-w-md"
          @click.stop
        >
          <div class="wz-panel card-hover overflow-hidden shadow-lg">
            <div class="wz-panel-header flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="wz-accent shrink-0">$</span>
                <span class="wz-label truncate">{{ t('welcomeModal.cmd') }}</span>
              </div>
              <span
                class="shrink-0 text-[11px] uppercase tracking-widest px-2 py-0.5 rounded border"
                style="border-color: var(--term-accent-line); color: var(--term-accent-strong); background: var(--term-accent-soft)"
              >
                {{ t('welcomeModal.badge') }}
              </span>
            </div>

            <div class="p-6 sm:p-7 space-y-5">
              <div class="space-y-2">
                <h2 :id="titleId" class="text-lg font-semibold wz-strong tracking-tight">
                  {{ t('welcomeModal.title') }}
                </h2>
                <p :id="descId" class="text-[12px] sm:text-xs wz-muted leading-relaxed">
                  {{ t('welcomeModal.subtitle') }}
                </p>
              </div>

              <div class="space-y-2">
                <p class="text-[11px] uppercase tracking-widest wz-label">
                  {{ t('welcomeModal.stepsLabel') }}
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(tag, i) in stepTags"
                    :key="i"
                    class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono tabular-nums border"
                    style="border-color: var(--term-accent-faint); background: var(--term-bg-soft); color: var(--term-text-muted)"
                  >
                    <span class="wz-accent opacity-80">{{ String(i + 1).padStart(2, '0') }}</span>
                    <span>{{ tag }}</span>
                  </span>
                </div>
              </div>

              <ul class="space-y-2.5" role="list">
                <li
                  v-for="(item, idx) in featureItems"
                  :key="idx"
                  class="flex gap-3 rounded-md border p-3"
                  style="border-color: var(--term-accent-faint); background: var(--term-bg-soft)"
                >
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs wz-accent border font-mono"
                    style="border-color: var(--term-accent-line); background: var(--term-accent-soft)"
                    aria-hidden="true"
                  >
                    {{ item.glyph }}
                  </span>
                  <p class="text-[11px] sm:text-xs wz-muted leading-snug pt-0.5">
                    {{ item.text }}
                  </p>
                </li>
              </ul>

              <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 pt-1">
                <button
                  type="button"
                  class="wz-btn-ghost w-full sm:w-auto sm:min-w-28 justify-center text-xs py-2.5 sm:py-2"
                  @click="dismiss"
                >
                  {{ t('welcomeModal.skip') }}
                </button>
                <button
                  type="button"
                  class="wz-btn-primary flex-1 justify-center text-xs py-2.5 sm:py-2 gap-1.5"
                  @click="goToSetup"
                >
                  <span>{{ t('welcomeModal.cta') }}</span>
                  <span class="opacity-90" aria-hidden="true">▶</span>
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
import { useI18n } from 'vue-i18n'

const STORAGE_KEY = 'hypar-onboarding-seen'

const { t, tm } = useI18n({ useScope: 'global' })
const { theme } = useTerminalPrefs()

const visible = ref(false)
const titleId = `wz-welcome-title-${useId()}`
const descId = `wz-welcome-desc-${useId()}`

const stepTags = computed(() => {
  const raw = tm('welcomeModal.stepTags')
  return Array.isArray(raw) ? (raw as string[]) : []
})

const featureItems = computed(() => [
  { glyph: '◇', text: t('welcomeModal.features.providers') },
  { glyph: '▣', text: t('welcomeModal.features.vector') },
  { glyph: '⌁', text: t('welcomeModal.features.layers') },
])

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value) dismiss()
}

onMounted(() => {
  window.addEventListener('keydown', onEscape)
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      visible.value = true
    }
  } catch {
    /* private mode */
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape)
})

function dismiss() {
  visible.value = false
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode */
  }
}

async function goToSetup() {
  dismiss()
  await navigateTo('/setup')
}
</script>

<style scoped>
.wz-welcome-overlay {
  background: color-mix(in srgb, var(--term-bg) 40%, #000);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.terminal-theme.theme-light .wz-welcome-overlay {
  background: color-mix(in srgb, var(--term-bg) 65%, #6b6b6b);
}

.wz-welcome-enter-active,
.wz-welcome-leave-active {
  transition: opacity 0.22s ease;
}

.wz-welcome-enter-active .wz-panel,
.wz-welcome-leave-active .wz-panel {
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s ease;
}

.wz-welcome-enter-from,
.wz-welcome-leave-to {
  opacity: 0;
}

.wz-welcome-enter-from .wz-panel,
.wz-welcome-leave-to .wz-panel {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
