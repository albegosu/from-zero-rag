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

        <!-- workspace selector (custom dropdown) -->
        <div v-if="user && workspaces.length" ref="wsDropdownRef" class="relative hidden md:block shrink-0 mr-1">
          <button
            type="button"
            class="wz-btn-ghost text-[11px] flex items-center gap-1"
            :aria-expanded="wsOpen"
            aria-haspopup="listbox"
            @click="wsOpen = !wsOpen"
          >
            <span class="wz-faint shrink-0">ws/</span>
            <span class="wz-muted whitespace-nowrap">{{ activeWorkspaceName }}</span>
            <span class="wz-faint shrink-0" :class="wsOpen ? 'rotate-180' : ''" style="display:inline-block;transition:transform .15s">▾</span>
          </button>

          <div
            v-if="wsOpen"
            class="absolute right-0 top-full mt-1 z-60 glass hairline border border-[var(--wz-border)] rounded min-w-[160px] py-1 shadow-lg"
          >
            <button
              v-for="ws in workspaces"
              :key="ws.id"
              type="button"
              class="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-[var(--wz-hover)] transition-colors"
              :class="ws.id === activeWorkspaceId ? 'wz-strong' : 'wz-muted'"
              :disabled="ws.id === activeWorkspaceId"
              @click="selectWorkspace(ws.id)"
            >
              <span class="wz-faint shrink-0">{{ ws.id === activeWorkspaceId ? '●' : '○' }}</span>
              <span class="truncate">{{ ws.name }}</span>
              <span v-if="ws.id === activeWorkspaceId" class="ml-auto wz-faint shrink-0">active</span>
            </button>
            <div class="hairline-t mt-1 pt-1">
              <NuxtLink
                to="/workspaces"
                class="block px-3 py-1.5 text-[11px] wz-faint hover:wz-muted transition-colors"
                @click="wsOpen = false"
              >
                + manage workspaces
              </NuxtLink>
            </div>
          </div>
        </div>

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
      <div v-if="workspaces.length" class="flex items-center gap-2 mb-2">
        <span class="wz-faint shrink-0">ws/</span>
        <select
          class="wz-select text-[11px] flex-1"
          :value="activeWorkspaceId"
          @change="selectWorkspace(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="ws in workspaces" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
        </select>
      </div>

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
const route = useRoute()

// ── Workspace selector ──────────────────────────────────────────────────────
interface Workspace { id: string; name: string; active: boolean }
const workspaces = ref<Workspace[]>([])
const activeWorkspaceId = ref<string>('')
const wsOpen = ref(false)
const wsDropdownRef = ref<HTMLElement | null>(null)

const activeWorkspaceName = computed(
  () => workspaces.value.find((w) => w.id === activeWorkspaceId.value)?.name ?? '…'
)

async function fetchWorkspaces() {
  if (!user.value) return
  try {
    const data = await $fetch<Workspace[]>('/api/workspaces')
    workspaces.value = data
    activeWorkspaceId.value = data.find((w) => w.active)?.id ?? data[0]?.id ?? ''
  } catch {}
}

async function selectWorkspace(id: string) {
  if (!id || id === activeWorkspaceId.value) { wsOpen.value = false; return }
  await $fetch(`/api/workspaces/${id}/activate`, { method: 'POST' })
  wsOpen.value = false
  window.location.reload()
}

function onClickOutside(e: MouseEvent) {
  if (wsDropdownRef.value && !wsDropdownRef.value.contains(e.target as Node)) {
    wsOpen.value = false
  }
}

watch(wsOpen, (open) => {
  if (open) document.addEventListener('click', onClickOutside, { capture: true })
  else document.removeEventListener('click', onClickOutside, { capture: true })
})

onUnmounted(() => document.removeEventListener('click', onClickOutside, { capture: true }))

watch(() => user.value, (u) => { if (u) fetchWorkspaces() }, { immediate: true })

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

const section = computed(() => {
  const path = route.path
  if (path === '/') return 'chat'
  if (path.startsWith('/documents')) return path.replace(/^\//, '')
  if (path.startsWith('/upload')) return 'upload'
  return path.replace(/^\//, '')
})

async function logout() {
  loggingOut.value = true
  await signOut()
  clearNuxtData('auth-session')
  window.location.href = '/auth/signin'
}
</script>
