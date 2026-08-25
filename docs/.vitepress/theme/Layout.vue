<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import HomeHeroExtras from './HomeHeroExtras.vue'
import HomeHeroHudStamp from './HomeHeroHudStamp.vue'
import HomeHeroParaboloid from './HomeHeroParaboloid.vue'
import HomeFeaturesExtras from './HomeFeaturesExtras.vue'
import HomeHeroTerminal from './HomeHeroTerminal.vue'
import HomeLandingAnimations from './HomeLandingAnimations.vue'
import HomeWhatIs from './HomeWhatIs.vue'
import HomeQuickStart from './HomeQuickStart.vue'
import HomeArchitecture from './HomeArchitecture.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-info-before>
      <HomeHeroParaboloid />
      <HomeHeroHudStamp />
    </template>
    <template #home-hero-actions-after>
      <HomeHeroTerminal />
    </template>
    <template #home-hero-after>
      <HomeWhatIs />
      <HomeHeroExtras />
    </template>
    <template #home-features-before>
      <HomeQuickStart />
      <HomeArchitecture />
    </template>
    <template #home-features-after>
      <HomeFeaturesExtras />
    </template>
  </Layout>
  <HomeLandingAnimations />
</template>
