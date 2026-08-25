<script setup lang="ts">
/** Landing: gsap.matchMedia('no-preference') + ScrollTrigger; fades use autoAlpha (gsap-core). */
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vitepress'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let landingMm: gsap.MatchMedia | null = null
let resizeRefreshTimer: ReturnType<typeof setTimeout> | null = null

function scheduleScrollTriggerRefresh() {
  if (typeof window === 'undefined') return
  if (resizeRefreshTimer !== null) clearTimeout(resizeRefreshTimer)
  resizeRefreshTimer = setTimeout(() => {
    ScrollTrigger.refresh()
    resizeRefreshTimer = null
  }, 180)
}

function teardown() {
  landingMm?.revert()
  landingMm = null
}

function bootLandingAnimations(root: HTMLElement) {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(root.querySelectorAll('.VPHomeHero .heading .name, .VPHomeHero .heading .text'), {
      autoAlpha: 0,
      y: 14,
      x: -4,
      duration: 0.62,
      stagger: 0.09,
      ease: 'power2.out',
    })
    .from(
      root.querySelectorAll('.VPHomeHero .tagline'),
      { autoAlpha: 0, y: 10, x: -2, duration: 0.52, ease: 'power2.out' },
      '-=0.32',
    )
    .from(
      root.querySelectorAll('.VPHomeHero .actions .action'),
      { autoAlpha: 0, y: 8, x: -4, duration: 0.46, stagger: 0.06, ease: 'power2.out' },
      '-=0.26',
    )
    .from(
      root.querySelectorAll('.VPHomeHero .ht'),
      { autoAlpha: 0, y: 8, x: -2, duration: 0.46, ease: 'power2.out' },
      '-=0.2',
    )
    .from(
      root.querySelector('.home-demo'),
      { autoAlpha: 0, y: 20, duration: 0.55, ease: 'power3.out' },
      '-=0.12',
    )

  const featuresRoot = root.querySelector('.VPFeatures')
  const featureItems = featuresRoot?.querySelectorAll('.item') ?? []
  if (featureItems.length) {
    gsap.from(featureItems, {
      scrollTrigger: {
        trigger: featuresRoot as Element,
        start: 'top 84%',
        once: true,
      },
      autoAlpha: 0,
      y: 22,
      duration: 0.52,
      stagger: 0.12,
      ease: 'power3.out',
    })
  }

  const firstBlock = root.querySelector('.hfx > .hfx__block:first-of-type')
  if (firstBlock) {
    const hl = firstBlock.querySelectorAll('.hfx__highlight')
    gsap
      .timeline({
        scrollTrigger: {
          trigger: firstBlock,
          start: 'top 82%',
          once: true,
        },
      })
      .from(firstBlock.querySelectorAll('.hfx__eyebrow'), {
        autoAlpha: 0,
        y: 12,
        duration: 0.38,
      })
      .from(hl, { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.06 }, '-=0.12')
  }

  const roadmapBlock = root.querySelector('.hfx > .hfx__block:nth-of-type(2)')
  if (roadmapBlock) {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: roadmapBlock,
          start: 'top 82%',
          once: true,
        },
      })
      .from(
        roadmapBlock.querySelectorAll('.hfx__row .hfx__eyebrow, .hfx__row .hfx__link'),
        { autoAlpha: 0, y: 10, duration: 0.38, stagger: 0.06 },
      )
      .from(
        roadmapBlock.querySelectorAll('.hfx__stage'),
        { autoAlpha: 0, y: 16, duration: 0.45, stagger: 0.045 },
        '-=0.15',
      )
  }

  const learnerBlock = root.querySelector('.hfx > .hfx__block:nth-of-type(3)')
  if (learnerBlock) {
    gsap.from(learnerBlock, {
      scrollTrigger: {
        trigger: learnerBlock,
        start: 'top 86%',
        once: true,
      },
      autoAlpha: 0,
      y: 22,
      duration: 0.55,
      ease: 'power3.out',
    })
  }

  const footerEl = root.querySelector('.hfx__footer')
  if (footerEl) {
    gsap.from(footerEl, {
      scrollTrigger: {
        trigger: footerEl,
        start: 'top 88%',
        once: true,
      },
      autoAlpha: 0,
      y: 16,
      duration: 0.5,
      ease: 'power3.out',
    })
  }
}

async function bindLanding() {
  teardown()
  if (typeof window === 'undefined') return

  await nextTick()
  await nextTick()

  const root = document.querySelector('.VPHome') as HTMLElement | null

  if (!root) return

  landingMm = gsap.matchMedia()
  landingMm.add('(prefers-reduced-motion: no-preference)', () => {
    bootLandingAnimations(root)
  }, root)

  ScrollTrigger.refresh()
}

const route = useRoute()

watch(
  () => route.path,
  () => {
    void bindLanding()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('resize', scheduleScrollTriggerRefresh)
  const vv = window.visualViewport
  if (vv) {
    vv.addEventListener('resize', scheduleScrollTriggerRefresh)
    vv.addEventListener('scroll', scheduleScrollTriggerRefresh)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleScrollTriggerRefresh)
  const vv = window.visualViewport
  if (vv) {
    vv.removeEventListener('resize', scheduleScrollTriggerRefresh)
    vv.removeEventListener('scroll', scheduleScrollTriggerRefresh)
  }
  if (resizeRefreshTimer !== null) {
    clearTimeout(resizeRefreshTimer)
    resizeRefreshTimer = null
  }
  teardown()
})
</script>

<template><!-- renderless --></template>
