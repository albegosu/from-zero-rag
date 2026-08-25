<template>
  <nav aria-label="Main navigation" class="fixed bottom-0 left-0 right-0 z-50 glass hairline-t pb-safe">
    <div class="max-w-3xl mx-auto px-4">
      <div class="flex justify-around py-2">
        <NuxtLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors duration-150 relative"
          :class="[
            isActive(item.path) ? 'nav-active-pill wz-strong' : 'wz-muted hover:text-[color:var(--term-text-strong)]'
          ]"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <UIcon :name="item.icon" class="w-5 h-5 relative" />
          <span class="text-[11px] font-medium relative">{{ t(item.label) }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const { isAuthenticated, isAdmin } = useAuth()

const baseItems = [
  { path: '/', icon: 'i-heroicons-sparkles', label: 'nav.garden' },
]

const authItems = [
  { path: '/settings', icon: 'i-heroicons-cog-6-tooth', label: 'nav.settings' },
]

const adminItem = { path: '/admin', icon: 'i-heroicons-adjustments-horizontal', label: 'nav.admin' }

const items = computed(() => {
  if (!isAuthenticated.value) return baseItems
  return isAdmin.value
    ? [...baseItems, ...authItems, adminItem]
    : [...baseItems, ...authItems]
})

function isActive(path: string) {
  if (path === '/') return route.path === '/' || route.path.startsWith('/embryo/')
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
