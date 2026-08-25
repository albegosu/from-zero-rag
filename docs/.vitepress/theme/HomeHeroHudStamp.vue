<script setup lang="ts">
/**
 * Industrial / spec-sheet HUD layer for the docs home hero.
 * GSAP: staggered reveal + transform only; respects prefers-reduced-motion (gsap-core).
 */
import gsap from 'gsap'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const rootRef = ref<HTMLElement | null>(null)
let hudMm: gsap.MatchMedia | null = null

onMounted(() => {
  if (typeof window === 'undefined') return
  const el = rootRef.value
  if (!el) return

  hudMm = gsap.matchMedia()
  hudMm.add('(prefers-reduced-motion: no-preference)', () => {
    const targets = el.querySelectorAll<HTMLElement>('[data-hud-reveal]')
    gsap.set(targets, { autoAlpha: 0, y: 6 })
    gsap.to(targets, {
      autoAlpha: 1,
      y: 0,
      duration: 0.56,
      stagger: { each: 0.055, from: 'start' },
      ease: 'power2.out',
      delay: 0.14,
    })
    return () => {
      gsap.killTweensOf(targets)
    }
  }, el)
})

onBeforeUnmount(() => {
  hudMm?.revert()
  hudMm = null
})
</script>

<template>
  <div ref="rootRef" class="hpp-hud" aria-hidden="true">
    <!-- Left cluster -->
    <div class="hpp-hud__cluster hpp-hud__cluster--left">
      <svg class="hpp-hud__sig" viewBox="0 0 72 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="18" r="10" stroke="currentColor" stroke-width="1" />
        <circle cx="34" cy="18" r="10" stroke="currentColor" stroke-width="1" opacity="0.72" />
        <circle cx="54" cy="18" r="10" stroke="currentColor" stroke-width="1" opacity="0.45" />
        <path d="M24 10v16M44 10v16" stroke="currentColor" stroke-width="0.85" opacity="0.5" />
      </svg>
      <p class="hpp-hud__mono hpp-hud__code" data-hud-reveal>EMBRYO / TS / NUXT</p>
    </div>

    <!-- Top center spec header -->
    <div class="hpp-hud__cluster hpp-hud__cluster--top">
      <p class="hpp-hud__head" data-hud-reveal>LAB</p>
      <p class="hpp-hud__sub" data-hud-reveal>AI INTERACTION · RESEARCH</p>
      <p class="hpp-hud__mono hpp-hud__dot" data-hud-reveal>EMBRYO DOMAIN · AGENT COLLABORATOR</p>
      <span class="hpp-hud__pill" data-hud-reveal>OPEN SOURCE</span>
    </div>

    <!-- Right mark -->
    <div class="hpp-hud__cluster hpp-hud__cluster--right">
      <svg class="hpp-hud__mark" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 8l14 14-14 14L10 22z" stroke="currentColor" stroke-width="1" stroke-linejoin="miter" />
        <path d="M24 14l8 8-8 8-8-8z" stroke="currentColor" stroke-width="0.95" opacity="0.55" />
      </svg>
      <p class="hpp-hud__mono hpp-hud__code hpp-hud__code--sm" data-hud-reveal>HYPAR / pnpm</p>
    </div>

    <!-- Bottom band -->
    <div class="hpp-hud__cluster hpp-hud__cluster--bottom">
      <p class="hpp-hud__serif" data-hud-reveal>IV</p>
      <div class="hpp-hud__bottom-copy">
        <p class="hpp-hud__mono" data-hud-reveal>EXP 01 — EMBRYO LIFECYCLE</p>
        <p class="hpp-hud__mono hpp-hud__muted" data-hud-reveal>INTERACTION RESEARCH</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hpp-hud {
  pointer-events: none;
  position: absolute;
  z-index: 0;
  left: 50%;
  top: 0;
  width: min(100vw, 100dvw);
  height: min(100vh, 100svh);
  transform: translateX(-50%);
  overflow: hidden;
  color: color-mix(in srgb, var(--vp-c-brand-1) 52%, var(--vp-c-text-3) 48%);
  font-family: var(--hpp-font-mono), ui-monospace, monospace;
}

@media (prefers-reduced-motion: reduce) {
  .hpp-hud [data-hud-reveal] {
    opacity: 1 !important;
    visibility: inherit !important;
    transform: none !important;
  }
}

.hpp-hud__cluster {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Top-based offsets: stay in first screen, visibly lower than the original upper tier */
.hpp-hud__cluster--left {
  left: max(16px, 4vw);
  top: 55%;
  align-items: flex-start;
}

.hpp-hud__cluster--top {
  left: 50%;
  top: 50%;
  transform: translateX(-50%);
  text-align: center;
  align-items: center;
  max-width: min(92vw, 420px);
}

.hpp-hud__cluster--right {
  right: max(16px, 4vw);
  top: 55%;
  align-items: flex-end;
}

.hpp-hud__cluster--bottom {
  left: max(16px, 4vw);
  right: max(16px, 4vw);
  bottom: clamp(72px, 14vh, 180px);
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hpp-hud__sig {
  width: 72px;
  height: 36px;
  margin-bottom: 6px;
  opacity: 0.38;
}

.hpp-hud__mark {
  width: 40px;
  height: 40px;
  margin-bottom: 6px;
  opacity: 0.42;
}

.hpp-hud__head {
  margin: 0;
  font-family: var(--hpp-font-sans), system-ui, sans-serif;
  font-size: clamp(1rem, 1.9vw, 1.45rem);
  font-weight: 600;
  letter-spacing: 0.2em;
  color: color-mix(in srgb, var(--vp-c-brand-1) 65%, var(--vp-c-text-2) 35%);
  line-height: 1.15;
  opacity: 0.88;
}

.hpp-hud__sub {
  margin: 0;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--vp-c-brand-1) 48%, var(--vp-c-text-3) 52%);
  opacity: 0.95;
}

.hpp-hud__dot {
  margin: 2px 0 0;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-text-3) 60%);
}

.hpp-hud__pill {
  margin-top: 8px;
  padding: 3px 11px;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: color-mix(in srgb, var(--vp-c-brand-1) 62%, var(--vp-c-text-2) 38%);
  background: transparent;
}

.hpp-hud__mono {
  margin: 0;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  opacity: 0.88;
}

.hpp-hud__muted {
  opacity: 0.55;
  font-size: 8px;
  letter-spacing: 0.14em;
}

.hpp-hud__code {
  max-width: 180px;
  line-height: 1.35;
}

.hpp-hud__code--sm {
  font-size: 8px;
  letter-spacing: 0.04em;
  opacity: 0.75;
  text-align: right;
}

.hpp-hud__serif {
  margin: 0;
  font-family: var(--hpp-font-display), Georgia, serif;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 600;
  line-height: 1;
  color: color-mix(in srgb, var(--vp-c-brand-1) 42%, var(--vp-c-text-2) 58%);
  opacity: 0.55;
}

.hpp-hud__bottom-copy {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

@media (max-width: 640px) {
  /* Left sig and right mark: hug bottom corners */
  .hpp-hud__cluster--left {
    top: auto;
    bottom: max(16px, env(safe-area-inset-bottom, 0px) + 12px);
  }

  .hpp-hud__cluster--right {
    top: auto;
    bottom: max(16px, env(safe-area-inset-bottom, 0px) + 12px);
  }

  /* Only the LAB label: centered, above the corner ornaments */
  .hpp-hud__cluster--top {
    top: auto;
    bottom: clamp(88px, 15vh, 148px);
  }

  /* Bottom cluster: overflow-prone long text — hide entirely */
  .hpp-hud__cluster--bottom {
    display: none;
  }

  /* Left: keep SVG sig, hide code text */
  .hpp-hud__cluster--left .hpp-hud__code {
    display: none;
  }

  /* Right: keep mark SVG, hide code text */
  .hpp-hud__cluster--right .hpp-hud__code--sm {
    display: none;
  }

  /* Top cluster: only show "LAB" — hide sub, dot and pill */
  .hpp-hud__cluster--top .hpp-hud__sub,
  .hpp-hud__cluster--top .hpp-hud__dot,
  .hpp-hud__cluster--top .hpp-hud__pill {
    display: none;
  }

  /* Resize ornaments for mobile */
  .hpp-hud__sig {
    width: 56px;
    height: 28px;
  }

  .hpp-hud__mark {
    width: 28px;
    height: 28px;
    margin-bottom: 0;
  }

  /* LAB label: slightly quieter so it doesn’t read as duplicate hero title */
  .hpp-hud__head {
    font-size: clamp(0.75rem, 3.2vw, 0.95rem);
    letter-spacing: 0.16em;
    opacity: 0.72;
  }
}
</style>
