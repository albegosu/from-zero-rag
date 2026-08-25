<script setup lang="ts">
import { withBase } from 'vitepress'
import MicroGlyph from '../../../components/micro/MicroGlyph.vue'
import { useI18n } from './i18n'

const t = useI18n()

interface Stage {
  num: string
  label: string
  status?: 'now' | 'next'
}

const stages: Stage[] = [
  { num: '01', label: 'Embryo lifecycle', status: 'now' },
  { num: '02', label: 'Agent collaborator', status: 'now' },
  { num: '03', label: 'Tensions & connections', status: 'next' },
  { num: '04', label: 'Fossilization UX' },
  { num: '05', label: 'Multi-agent dialogue' },
  { num: '06', label: 'Pattern extraction' },
  { num: '07', label: 'Interaction metrics' },
  { num: '08', label: 'Knowledge graph' },
  { num: '09', label: 'ai-elements-nuxt' },
  { num: '10', label: 'New experiment' },
]

const stack = ['Nuxt 3', 'Ollama', 'AI SDK', 'Prisma 7', 'PostgreSQL']

const highlightIcons = [
  '<path d="M4 4h6v6H4z"/><path d="M14 14h6v6h-6z"/><path d="M10 10l4 4"/>',
  '<path d="M7 7h10v10H7z"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M12 3v4"/><path d="M12 17v4"/>',
  '<path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h16"/><path d="M18 9l3 3-3 3"/>',
  '<path d="M12 2v6"/><circle cx="12" cy="14" r="8"/><path d="M9 14l2 2 4-4"/>',
  '<path d="M7 7h3v6H7z"/><path d="M14 7h3v6h-3z"/><path d="M7 17h10"/>',
  '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>',
]
</script>

<template>
  <section class="hfx">
    <!-- What's inside -->
    <div class="hfx__block">
      <p class="hfx__eyebrow hfx__eyebrow--glyph">
        <MicroGlyph name="sparkle" decorative class="hfx__eyebrow-icon" /> {{ t.whatsInside }}
      </p>
      <div class="hfx__grid hfx__grid--2">
        <div
          v-for="(h, i) in t.highlights"
          :key="h.title"
          class="hfx__highlight"
        >
          <span
            class="hfx__highlight-icon"
            v-html="`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>${highlightIcons[i]}</svg>`"
          />
          <div>
            <p class="hfx__highlight-title">{{ h.title }}</p>
            <p class="hfx__highlight-details">{{ h.details }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Roadmap track -->
    <div class="hfx__block">
      <div class="hfx__row">
        <p class="hfx__eyebrow hfx__eyebrow--glyph">
          <MicroGlyph name="sectionRule" decorative class="hfx__eyebrow-rule" /> {{ t.roadmapLabel }}
        </p>
        <a :href="withBase('/roadmap')" class="hfx__link">{{ t.viewRoadmap }}</a>
      </div>
      <div class="hfx__grid hfx__grid--5">
        <div
          v-for="s in stages"
          :key="s.num"
          class="hfx__stage"
          :class="{ 'hfx__stage--now': s.status === 'now', 'hfx__stage--next': s.status === 'next' }"
        >
          <p class="hfx__stage-num">
            {{ s.num }}<span v-if="s.status === 'now'"> · Now</span><span v-else-if="s.status === 'next'"> · Next</span>
          </p>
          <p class="hfx__stage-label">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- CTAs: Learner + Contributor -->
    <div class="hfx__block">
      <div class="hfx__cta-grid">
        <!-- Learner -->
        <a :href="withBase('/guide/getting-started')" class="hfx__learner">
          <span class="hfx__learner-icon">
            <MicroGlyph name="learningCap" decorative />
          </span>
          <div class="hfx__learner-body">
            <p class="hfx__learner-title">{{ t.learner.title }}</p>
            <p class="hfx__learner-details">{{ t.learner.details }}</p>
          </div>
          <span class="hfx__learner-cta">{{ t.learner.cta }}</span>
        </a>

        <!-- Contributor -->
        <a
          href="https://github.com/albegosu/hypar/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="hfx__learner"
        >
          <span class="hfx__learner-icon">
            <MicroGlyph name="sparkle" decorative />
          </span>
          <div class="hfx__learner-body">
            <p class="hfx__learner-title">{{ t.contributor.title }}</p>
            <p class="hfx__learner-details">{{ t.contributor.details }}</p>
          </div>
          <span class="hfx__learner-cta">{{ t.contributor.cta }}</span>
        </a>
      </div>
    </div>

    <!-- Footer: stack + meta + badges -->
    <div class="hfx__block hfx__footer">
      <div class="hfx__footer-inner">
        <div class="hfx__footer-left">
          <span class="hfx__footer-tag">Built with</span>
          <div class="hfx__stack">
            <span v-for="s in stack" :key="s" class="hfx__chip">{{ s }}</span>
          </div>
        </div>
        <div class="hfx__stats" aria-label="Project meta">
          <a
            class="hfx__stat hfx__stat--link"
            href="https://github.com/albegosu/hypar/releases"
            target="_blank"
            rel="noopener"
          >
            <p class="hfx__stat-value">v0.4</p>
            <p class="hfx__stat-label">Release</p>
          </a>
          <a
            class="hfx__stat hfx__stat--link"
            href="https://github.com/albegosu/hypar/blob/main/LICENSE"
            target="_blank"
            rel="noopener"
          >
            <p class="hfx__stat-value">MIT</p>
            <p class="hfx__stat-label">License</p>
          </a>
          <a class="hfx__stat hfx__stat--link" href="https://github.com/albegosu/hypar" target="_blank" rel="noopener">
            <p class="hfx__stat-value">GitHub</p>
            <p class="hfx__stat-label">Source</p>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Match VPHomeContent — max-width includes horizontal padding pattern */
.hfx {
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px 40px;
}
@media (min-width: 640px) { .hfx { padding: 0 48px 48px; } }
@media (min-width: 960px) { .hfx { padding: 0 64px 56px; } }

.hfx__block { margin-top: 44px; }
.hfx__block.hfx__footer { margin-top: 32px; }
.hfx__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin-bottom: 16px; }

.hfx__eyebrow {
  font-size: 12px; font-weight: 500; margin: 0 0 16px;
  color: var(--vp-c-text-3); text-transform: uppercase; letter-spacing: 0.06em;
}
.hfx__eyebrow--glyph {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hfx__eyebrow-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: color-mix(in srgb, var(--vp-c-text-3) 85%, transparent);
}
.hfx__eyebrow-rule {
  width: 28px;
  height: 14px;
  flex-shrink: 0;
  color: color-mix(in srgb, var(--vp-c-text-3) 72%, transparent);
}
.hfx__row .hfx__eyebrow { margin-bottom: 0; }

.hfx__link {
  font-size: 13px; color: var(--vp-c-brand-1); text-decoration: none; flex-shrink: 0;
}
.hfx__link:hover { text-decoration: underline; }

.hfx__grid { display: grid; gap: 12px; }
.hfx__grid--2 { grid-template-columns: 1fr; }
.hfx__grid--5 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 640px) {
  .hfx__grid--2 { grid-template-columns: repeat(2, 1fr); }
  .hfx__grid--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
}

.hfx__highlight {
  display: flex; gap: 12px; padding: 14px;
  background: var(--vp-c-bg-soft); border-radius: 10px;
}
.hfx__highlight-icon {
  flex-shrink: 0; color: var(--vp-c-text-2); display: inline-flex;
  width: 22px; height: 22px;
}
.hfx__highlight-icon :deep(svg) { width: 100%; height: 100%; }
.hfx__highlight-title { font-size: 14px; font-weight: 500; margin: 0; color: var(--vp-c-text-1); }
.hfx__highlight-details { font-size: 13px; margin: 4px 0 0; color: var(--vp-c-text-2); line-height: 1.5; }

.hfx__stage {
  padding: 12px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid transparent;
}
.hfx__stage--now {
  background: color-mix(in srgb, var(--vp-c-brand-soft) 78%, var(--vp-c-bg-soft));
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 38%, var(--vp-c-divider));
}
.hfx__stage--next {
  border-color: var(--vp-c-divider);
}
.hfx__stage-num {
  font-size: 11px; font-weight: 500; margin: 0 0 4px;
  color: var(--vp-c-text-3); letter-spacing: 0.02em;
}
.hfx__stage--now .hfx__stage-num { color: var(--vp-c-brand-1); }
.hfx__stage-label { font-size: 13px; font-weight: 500; margin: 0; color: var(--vp-c-text-1); }

/* CTA grid — two cards side by side */
.hfx__cta-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .hfx__cta-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.hfx__learner {
  display: flex; align-items: center; gap: 16px;
  padding: 18px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none; color: inherit;
  transition: border-color .15s ease;
}
.hfx__learner:hover { border-color: var(--vp-c-brand-1); }
.hfx__learner-icon {
  flex-shrink: 0; width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--vp-c-bg); border-radius: 10px; color: var(--vp-c-text-2);
}
.hfx__learner-icon svg { width: 24px; height: 24px; }
.hfx__learner-body { flex: 1; min-width: 0; }
.hfx__learner-title { font-size: 15px; font-weight: 500; margin: 0 0 2px; color: var(--vp-c-text-1); }
.hfx__learner-details { font-size: 13px; margin: 0; color: var(--vp-c-text-2); line-height: 1.5; }
.hfx__learner-cta { font-size: 13px; color: var(--vp-c-brand-1); flex-shrink: 0; }

.hfx__footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 14px;
}
.hfx__footer-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  min-width: min(100%, 240px);
}
.hfx__footer-tag {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.hfx__stack { display: flex; gap: 5px; flex-wrap: wrap; }
.hfx__chip {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 88%, transparent);
  border-radius: 999px;
  color: var(--vp-c-text-1);
}
.hfx__stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 18px;
}
.hfx__stat {
  display: grid;
  gap: 0;
  justify-items: start;
  min-width: 0;
  text-align: left;
  text-decoration: none;
  color: inherit;
}
.hfx__stat-value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--vp-c-text-1);
  line-height: 1.2;
}
.hfx__stat-label {
  font-size: 10px;
  margin: 1px 0 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
}
.hfx__stat--link:hover .hfx__stat-value { color: var(--vp-c-brand-1); }

.hfx__footer-resizes {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin: 8px 0 0;
}
</style>
