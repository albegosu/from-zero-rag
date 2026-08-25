<script setup lang="ts">
import { withBase } from 'vitepress'
import { useI18n } from './i18n'

const t = useI18n()
</script>

<template>
  <section class="home-demo">
    <div class="home-demo__inner">
      <div class="home-demo__hints">
        <p class="home-demo__hints-label">{{ t.demoPrompts.label }}</p>
        <div class="home-demo__hints-row">
          <span
            v-for="prompt in t.demoPrompts.prompts"
            :key="prompt"
            class="home-demo__prompt"
          >{{ prompt }}</span>
        </div>
        <p class="home-demo__hints-note">{{ t.demoPrompts.note }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-demo {
  box-sizing: border-box;
  margin: 2rem auto 0;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.home-demo__inner {
  margin: 8px 0 0;
  margin-inline: auto;
  max-width: 1280px;
  width: 100%;
}

.home-demo__hints {
  margin-top: 14px;
  padding: 0 4px;
}
.home-demo__hints-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin: 0 0 8px;
}
.home-demo__hints-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.home-demo__prompt {
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 5px 11px;
  white-space: nowrap;
}
.home-demo__hints-note {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin: 8px 0 0;
  font-family: var(--vp-font-family-mono);
  letter-spacing: 0.02em;
}

@media (min-width: 640px) {
  .home-demo {
    padding: 0 48px;
  }
}
@media (min-width: 960px) {
  .home-demo {
    padding: 0 64px;
  }
}
</style>
