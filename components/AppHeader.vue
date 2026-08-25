<template>
  <header class="sticky top-0 z-50 glass hairline-b">
    <div class="px-4 h-12 flex items-center justify-between text-xs">

      <NuxtLink to="/" class="flex items-center gap-3 shrink-0">
        <BrandHyparMark />
        <div class="flex items-center gap-2">
          <span class="wz-strong font-semibold">{{ t('app.brand') }}</span>
        </div>
      </NuxtLink>

      <a
        href="https://resiz.es"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden md:inline-flex items-center gap-1.5 shrink-0 ml-2 text-[11px] wz-faint hover:opacity-100 transition-opacity opacity-80"
        aria-label="Resizes"
        title="Resizes"
      >
        <span>by</span>
        <img
          :src="theme === 'light' ? '/logo-resizes-black.png' : '/logo-resizes.png'"
          alt="Resizes"
          class="h-2.5 w-auto block"
        >
      </a>

      <NuxtLink
        v-if="docsSiteUrl"
        :to="docsSiteUrl"
        external
        target="_blank"
        rel="noopener noreferrer"
        class="wz-btn-ghost inline-flex items-center gap-1.5 shrink-0 ml-1 sm:ml-2 px-2"
        :title="t('nav.docsSiteTitle')"
      >
        <MicroGlyph name="tutorial" decorative class="w-4 h-4 wz-accent" />
        <span class="hidden sm:inline text-[11px] wz-faint">{{ t('nav.docsSiteLabel') }}</span>
      </NuxtLink>

      <div class="flex flex-1 items-center gap-1 min-w-0 ml-auto justify-end">
        <!-- mobile menu toggle -->
        <button
          v-if="user"
          type="button"
          class="md:hidden wz-btn-ghost text-[11px] shrink-0"
          :aria-expanded="mobileMenuOpen"
          aria-label="Menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          {{ mobileMenuOpen ? '✕' : '☰' }}
        </button>

        <NuxtLink
          v-if="user && !isAdmin"
          to="/settings"
          class="hidden md:inline-flex wz-btn-ghost text-[11px] shrink-0"
        >
          [ settings ]
        </NuxtLink>

        <NuxtLink
          v-if="user && isAdmin"
          to="/admin"
          class="hidden md:inline-flex wz-btn-ghost text-[11px] shrink-0"
        >
          [ admin ]
        </NuxtLink>

        <button
          type="button"
          class="hidden md:inline-flex wz-btn-ghost text-[11px] shrink-0"
          :class="{ 'opacity-50': locale !== 'en' }"
          :aria-pressed="locale === 'en'"
          aria-label="Switch to English"
          @click="setLocale('en')"
        >
          EN
        </button>
        <span class="hidden md:inline wz-faint shrink-0">/</span>
        <button
          type="button"
          class="hidden md:inline-flex wz-btn-ghost text-[11px] shrink-0"
          :class="{ 'opacity-50': locale !== 'es' }"
          :aria-pressed="locale === 'es'"
          aria-label="Switch to Spanish"
          @click="setLocale('es')"
        >
          ES
        </button>

        <button
          type="button"
          class="wz-btn-ghost wz-theme-toggle ml-1 shrink-0"
          aria-label="Toggle theme"
          @click="toggleTheme"
        >
          {{ theme === 'light' ? '[ light ]' : '[ dark ]' }}
        </button>

        <div v-if="user" class="hidden md:flex items-center gap-1 ml-1 min-w-0 shrink-0">
          <span class="wz-faint shrink-0">@</span>
          <span class="wz-muted truncate max-w-[120px]">{{ userLabel }}</span>
        </div>

        <template v-if="user">
          <button
            v-if="!confirmLogout"
            type="button"
            class="hidden md:inline-flex wz-btn-ghost text-[11px] ml-1 shrink-0"
            @click="confirmLogout = true"
          >
            [ logout ]
          </button>
          <div v-else class="hidden md:flex items-center gap-1 ml-1 shrink-0">
            <span class="wz-faint text-[11px]">sure?</span>
            <button type="button" class="wz-btn-ghost text-[11px]" :disabled="loggingOut" @click="logout">
              {{ loggingOut ? '…' : 'yes' }}
            </button>
            <button type="button" class="wz-btn-ghost text-[11px]" @click="confirmLogout = false">
              no
            </button>
          </div>
        </template>
      </div>

    </div>

    <!-- Mobile slide-out menu -->
    <div
      v-if="user && mobileMenuOpen"
      class="md:hidden glass hairline-b px-4 py-3 space-y-2 text-xs"
    >
      <div class="flex flex-wrap gap-1">
        <NuxtLink
          v-if="!isAdmin"
          to="/settings"
          class="wz-btn-ghost text-[11px]"
          @click="mobileMenuOpen = false"
        >[ settings ]</NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          to="/admin"
          class="wz-btn-ghost text-[11px]"
          @click="mobileMenuOpen = false"
        >[ admin ]</NuxtLink>

        <button
          type="button"
          class="wz-btn-ghost text-[11px]"
          :class="{ 'opacity-50': locale !== 'en' }"
          @click="setLocale('en')"
        >EN</button>
        <span class="wz-faint">/</span>
        <button
          type="button"
          class="wz-btn-ghost text-[11px]"
          :class="{ 'opacity-50': locale !== 'es' }"
          @click="setLocale('es')"
        >ES</button>
      </div>

      <div class="flex items-center justify-between pt-1 hairline-t">
        <span class="wz-muted">@{{ userLabel }}</span>
        <button
          type="button"
          class="wz-btn-ghost text-[11px]"
          :disabled="loggingOut"
          @click="logout"
        >[ logout ]</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MicroGlyph from '~/components/micro/MicroGlyph.vue'
import { signOut } from '~/utils/auth-client'

const { t } = useI18n({ useScope: 'global' })
const { theme, locale, toggleTheme, setLocale } = useTerminalPrefs()
const { user, isAdmin } = useAuth()

const docsSiteUrl = computed(() => {
  const u = useRuntimeConfig().public.docsSiteUrl
  return typeof u === 'string' && u.trim() ? u.trim() : ''
})

const mobileMenuOpen = ref(false)
const loggingOut = ref(false)
const confirmLogout = ref(false)

const userLabel = computed(() => {
  if (!user.value) return ''
  return user.value.name || user.value.email?.split('@')[0] || 'user'
})

async function logout() {
  loggingOut.value = true
  await signOut()
  clearNuxtData('auth-session')
  window.location.href = '/auth/signin'
}
</script>
