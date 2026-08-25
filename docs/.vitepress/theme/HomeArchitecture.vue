<script setup lang="ts">
import { withBase } from 'vitepress'
import { useI18n } from './i18n'

const t = useI18n()
</script>

<template>
  <section class="har">
    <div class="har__inner">
      <div class="har__header">
        <p class="har__eyebrow">{{ t.architecture.eyebrow }}</p>
        <a :href="withBase('/architecture')" class="har__link">{{ t.architecture.link }}</a>
      </div>

      <div class="har__diagram" aria-label="hypar architecture diagram" role="img">
        <!-- Row 1: Client -->
        <div class="har__row har__row--client">
          <div class="har__box har__box--nuxt">
            <span class="har__box-label">Nuxt 3 · port 3000</span>
            <div class="har__box-inner">
              <div class="har__node har__node--accent">
                <span class="har__node-name">{{ t.architecture.nodeClient }}</span>
              </div>
              <div class="har__arrow har__arrow--down" aria-hidden="true">↓</div>
              <div class="har__node">
                <span class="har__node-name">{{ t.architecture.nodeServer }}</span>
              </div>
              <div class="har__arrow har__arrow--down" aria-hidden="true">↓</div>
              <div class="har__node">
                <span class="har__node-name">{{ t.architecture.nodeWorkflow }}</span>
                <span class="har__node-sub">{{ t.architecture.labelIngest }}</span>
              </div>
            </div>
          </div>

          <!-- Arrows to DB and Providers -->
          <div class="har__connector" aria-hidden="true">
            <div class="har__connector-line">
              <span class="har__connector-label">{{ t.architecture.labelRetrieve }}</span>
            </div>
            <div class="har__connector-line">
              <span class="har__connector-label">{{ t.architecture.labelEmbed }}</span>
            </div>
          </div>

          <!-- Right column: DB + Providers -->
          <div class="har__col-right">
            <div class="har__node har__node--db">
              <span class="har__node-name">{{ t.architecture.nodeDb }}</span>
              <span class="har__node-sub">vector(768) · HNSW · BM25</span>
            </div>
            <div class="har__node har__node--providers">
              <span class="har__node-name">{{ t.architecture.nodeProviders }}</span>
              <span class="har__node-sub">embed · generate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.har {
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  margin: 44px auto 0;
  padding: 0 24px;
}
@media (min-width: 640px) { .har { padding: 0 48px; } }
@media (min-width: 960px) { .har { padding: 0 64px; } }

.har__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 16px;
}

.har__eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin: 0;
  font-family: var(--vp-font-family-mono);
}

.har__link {
  font-size: 13px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  flex-shrink: 0;
}
.har__link:hover { text-decoration: underline; }

.har__diagram {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 20px;
  overflow-x: auto;
}

.har__row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 480px;
}

.har__box {
  flex: 1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.har__box-label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  background: color-mix(in srgb, var(--vp-c-bg) 60%, transparent);
  padding: 5px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.har__box-inner {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.har__node {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.har__node--accent {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
  background: color-mix(in srgb, var(--vp-c-brand-soft) 50%, var(--vp-c-bg));
}

.har__node--db,
.har__node--providers {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.har__node-name {
  font-size: 12px;
  font-weight: 500;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.har__node--accent .har__node-name {
  color: var(--vp-c-brand-1);
}

.har__node-sub {
  font-size: 10px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  letter-spacing: 0.03em;
}

.har__arrow {
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-align: center;
  line-height: 1;
  padding: 2px 0;
}

.har__connector {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  flex-shrink: 0;
  width: 120px;
}

.har__connector-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.har__connector-line::before {
  content: '';
  display: block;
  width: 80px;
  height: 1px;
  background: color-mix(in srgb, var(--vp-c-divider) 90%, transparent);
  border-top: 1px dashed var(--vp-c-divider);
}

.har__connector-label {
  font-size: 9px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  letter-spacing: 0.04em;
  text-align: center;
  white-space: nowrap;
}

.har__col-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 0 0 200px;
}

@media (max-width: 639px) {
  .har__col-right {
    flex: 0 0 160px;
  }
  .har__connector {
    width: 60px;
  }
}
</style>
