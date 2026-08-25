<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'
import { useI18n } from './i18n'

const t = useI18n()

type Tab = 'docker' | 'pnpm'
const active = ref<Tab>('docker')

const dockerCommands = `git clone https://github.com/albegosu/hypar.git
cd hypar
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY at minimum
docker compose --profile full up -d --build
open http://localhost:3000`

const pnpmCommands = `git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
cp .env.example .env
# Edit .env — set DATABASE_URL + GOOGLE_API_KEY
pnpm db:migrate
pnpm dev`

const dockerCopied = ref(false)
const pnpmCopied = ref(false)

async function copy(tab: Tab) {
  const text = tab === 'docker' ? dockerCommands : pnpmCommands
  const copied = tab === 'docker' ? dockerCopied : pnpmCopied
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1800)
}
</script>

<template>
  <section id="quick-start" class="hqs">
    <div class="hqs__inner">
      <p class="hqs__eyebrow">{{ t.quickStart.eyebrow }}</p>

      <div class="hqs__frame">
        <!-- Title bar -->
        <div class="hqs__bar">
          <div class="hqs__selectors">
            <button
              class="hqs__sel"
              :class="{ 'hqs__sel--active': active === 'docker' }"
              @click="active = 'docker'"
            >{{ t.quickStart.dockerLabel }}</button>
            <span class="hqs__bar-div" aria-hidden="true">·</span>
            <button
              class="hqs__sel"
              :class="{ 'hqs__sel--active': active === 'pnpm' }"
              @click="active = 'pnpm'"
            >{{ t.quickStart.pnpmLabel }}</button>
          </div>
          <button
            class="hqs__copy"
            @click="copy(active)"
          >
            {{ active === 'docker'
                ? (dockerCopied ? t.quickStart.copiedBtn : t.quickStart.copyBtn)
                : (pnpmCopied  ? t.quickStart.copiedBtn : t.quickStart.copyBtn) }}
          </button>
        </div>

        <!-- Code panels -->
        <div class="hqs__panels">
          <pre v-show="active === 'docker'" class="hqs__pre"><code>{{ dockerCommands }}</code></pre>
          <pre v-show="active === 'pnpm'"   class="hqs__pre"><code>{{ pnpmCommands }}</code></pre>
        </div>
      </div>

      <a :href="withBase('/guide/getting-started')" class="hqs__link">
        {{ t.quickStart.guideLink }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.hqs {
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  margin: 44px auto 0;
  padding: 0 24px;
}
@media (min-width: 640px) { .hqs { padding: 0 48px; } }
@media (min-width: 960px) { .hqs { padding: 0 64px; } }

.hqs__inner {
  max-width: 680px;
}

.hqs__eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin: 0 0 12px;
  font-family: var(--vp-font-family-mono);
}

/* Outer frame — flat, sharp, industrial */
.hqs__frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
}

/* Title bar */
.hqs__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 34px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 85%, transparent);
  border-bottom: 1px solid var(--vp-c-divider);
}

.hqs__selectors {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hqs__bar-div {
  font-size: 10px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  line-height: 1;
  user-select: none;
}

.hqs__sel {
  font-size: 11px;
  font-weight: 500;
  font-family: var(--vp-font-family-mono);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.12s;
  line-height: 1;
}

.hqs__sel--active {
  color: var(--vp-c-brand-1);
}

.hqs__sel:not(.hqs__sel--active):hover {
  color: var(--vp-c-text-2);
}

/* Copy button */
.hqs__copy {
  font-size: 10px;
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 2px;
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.hqs__copy:hover {
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 60%, transparent);
}

/* Code block */
.hqs__panels {
  background: var(--vp-c-bg);
}

.hqs__pre {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
  background: transparent;
  border: none;
  font-size: 13px;
  line-height: 1.7;
  font-family: var(--vp-font-family-mono);
}

.hqs__pre code {
  color: var(--vp-c-text-1);
  background: transparent;
  padding: 0;
  font-size: inherit;
  line-height: inherit;
}

.hqs__link {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  letter-spacing: 0.04em;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.hqs__link:hover { text-decoration: underline; }
</style>
