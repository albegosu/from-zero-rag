<template>
  <div class="terminal-theme min-h-screen" :class="{ 'theme-light': theme === 'light' }">
    <div class="wz-scanline app-backdrop min-h-screen flex flex-col">

      <header class="glass hairline-b px-4 h-12 flex items-center justify-between text-xs shrink-0">
        <div class="flex items-center gap-3">
          <BrandHyparMark />
          <span class="wz-strong font-semibold">hypar</span>
        </div>
        <button type="button" class="wz-btn-ghost wz-theme-toggle" @click="toggleTheme">
          {{ theme === 'light' ? 'Light' : 'Dark' }}
        </button>
      </header>

      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
          <div class="wz-panel">

            <div class="wz-panel-header flex items-center gap-2">
              <span class="wz-label">Sign in</span>
            </div>

            <div class="p-6 space-y-5">
              <div class="space-y-1">
                <h1 class="text-base font-semibold wz-strong">Welcome back</h1>
                <p class="text-[11px] wz-faint">Enter your credentials to continue</p>
              </div>

              <template v-if="hasOAuth">
                <div class="space-y-2">
                  <button
                    v-if="providers.google"
                    type="button"
                    class="wz-btn-outline w-full flex items-center justify-center gap-2"
                    :disabled="!!loadingProvider"
                    @click="loginWith('google')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {{ loadingProvider === 'google' ? '…' : 'continue with google' }}
                  </button>
                  <button
                    v-if="providers.github"
                    type="button"
                    class="wz-btn-outline w-full flex items-center justify-center gap-2"
                    :disabled="!!loadingProvider"
                    @click="loginWith('github')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    {{ loadingProvider === 'github' ? '…' : 'continue with github' }}
                  </button>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex-1 h-px" style="background: var(--term-accent-line)" />
                  <span class="text-[11px] wz-faint">or</span>
                  <div class="flex-1 h-px" style="background: var(--term-accent-line)" />
                </div>
              </template>

              <form class="space-y-4" @submit.prevent="loginWithEmail">
                <div class="space-y-1.5">
                  <label for="signin-email" class="text-[11px] uppercase tracking-widest wz-label">email</label>
                  <input
                    id="signin-email"
                    v-model="email"
                    type="email"
                    class="wz-input"
                    placeholder="you@example.com"
                    autocomplete="email"
                    required
                    aria-required="true"
                  />
                </div>
                <div class="space-y-1.5">
                  <label for="signin-password" class="text-[11px] uppercase tracking-widest wz-label">password</label>
                  <input
                    id="signin-password"
                    v-model="password"
                    type="password"
                    class="wz-input"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                    aria-required="true"
                  />
                </div>

                <div
                  v-if="error"
                  role="alert"
                  aria-live="assertive"
                  class="text-xs px-3 py-2 rounded font-mono"
                  style="color: var(--term-danger); background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25)"
                >
                  ⚠ {{ error }}
                </div>

                <button
                  type="submit"
                  class="wz-btn-primary w-full justify-center"
                  :disabled="loadingEmail"
                >
                  {{ loadingEmail ? '…' : 'Sign in' }}
                </button>
              </form>

              <p class="text-center text-[11px] wz-faint">
                no account?
                <NuxtLink to="/auth/signup" class="wz-accent hover:underline underline-offset-2">
                  sign up →
                </NuxtLink>
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { signIn } from '~/utils/auth-client'

definePageMeta({ layout: false, middleware: [] })

useSeoMeta({
  title: 'Sign In - hypar',
  description: 'Sign in to hypar, an AI interaction research lab.',
  ogTitle: 'Sign In - hypar',
  ogDescription: 'Sign in to hypar, an AI interaction research lab.',
  ogImage: '/hypar-chat-dark.png',
  twitterCard: 'summary_large_image',
})

const { theme, toggleTheme } = useTerminalPrefs()

const email = ref('')
const password = ref('')
const error = ref('')
const loadingEmail = ref(false)
const loadingProvider = ref<'google' | 'github' | null>(null)

const providers = ref<{ google: boolean; github: boolean }>({ google: false, github: false })
const hasOAuth = computed(() => providers.value.google || providers.value.github)

onMounted(async () => {
  try {
    providers.value = await $fetch('/api/config/auth-providers')
  } catch {
    // OAuth section stays hidden
  }
})

async function loginWithEmail() {
  error.value = ''
  loadingEmail.value = true
  try {
    const { error: err } = await signIn.email({ email: email.value, password: password.value })
    if (err) { error.value = err.message ?? 'Sign in failed'; return }
    window.location.href = '/'
  } finally {
    loadingEmail.value = false
  }
}

async function loginWith(provider: 'google' | 'github') {
  loadingProvider.value = provider
  await signIn.social({ provider, callbackURL: '/' })
}
</script>
