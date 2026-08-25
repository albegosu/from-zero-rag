<script setup lang="ts">
import { useI18n } from './i18n'

const t = useI18n()
</script>

<template>
  <section class="hwi">
    <div class="hwi__inner">
      <p class="hwi__eyebrow">{{ t.whatIs.eyebrow }}</p>
      <div class="hwi__body">
        <p class="hwi__description">{{ t.whatIs.description }}</p>
        <div class="hwi__audiences">
          <span
            v-for="a in t.whatIs.audiences"
            :key="a"
            class="hwi__chip"
          >{{ a }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hwi {
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (min-width: 640px) { .hwi { padding: 0 48px; } }
@media (min-width: 960px) { .hwi { padding: 0 64px; } }

.hwi__inner {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 32px;
  margin-top: 8px;
}

.hwi__eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin: 0 0 16px;
  font-family: var(--vp-font-family-mono);
}

.hwi__body {
  display: grid;
  gap: 20px 48px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .hwi__body {
    grid-template-columns: 1fr 220px;
    align-items: start;
  }
}

.hwi__description {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  max-width: 680px;
}

.hwi__audiences {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 480px) and (max-width: 767px) {
  .hwi__audiences {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.hwi__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 6px 12px;
  white-space: nowrap;
}

.hwi__chip::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  flex-shrink: 0;
}
</style>
