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
              <span class="wz-label">Create account</span>
            </div>

            <div class="p-6 space-y-5">
              <div class="space-y-1">
                <h1 class="text-base font-semibold wz-strong">Join hypar</h1>
                <p class="text-[11px] wz-faint">Create your workspace account</p>
              </div>

              <template v-if="hasOAuth">
                <div class="space-y-2">
                  <button
                    v-if="providers.google"
                    type="button"
                    class="wz-btn-outline w-full justify-center"
                    :disabled="!!loadingProvider"
                    @click="registerWith('google')"
                  >
                    {{ loadingProvider === 'google' ? '…' : 'Continue with Google' }}
                  </button>
                  <button
                    v-if="providers.github"
                    type="button"
                    class="wz-btn-outline w-full justify-center"
                    :disabled="!!loadingProvider"
                    @click="registerWith('github')"
                  >
                    {{ loadingProvider === 'github' ? '…' : 'Continue with GitHub' }}
                  </button>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex-1 h-px" style="background: var(--term-accent-line)" />
                  <span class="text-[11px] wz-faint">or</span>
                  <div class="flex-1 h-px" style="background: var(--term-accent-line)" />
                </div>
              </template>

              <form class="space-y-4" @submit.prevent="registerWithEmail">
                <div class="space-y-1.5">
                  <label for="signup-name" class="text-[11px] uppercase tracking-widest wz-label">name</label>
                  <input
                    id="signup-name"
                    v-model="name"
                    type="text"
                    class="wz-input"
                    placeholder="Your name"
                    autocomplete="name"
                    required
                    aria-required="true"
                  />
                </div>
                <div class="space-y-1.5">
                  <label for="signup-email" class="text-[11px] uppercase tracking-widest wz-label">email</label>
                  <input
                    id="signup-email"
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
                  <label for="signup-password" class="text-[11px] uppercase tracking-widest wz-label">password</label>
                  <input
                    id="signup-password"
                    v-model="password"
                    type="password"
                    class="wz-input"
                    placeholder="Min. 8 characters"
                    autocomplete="new-password"
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
                  {{ loadingEmail ? '…' : 'Create account' }}
                </button>
              </form>

              <p class="text-center text-[11px] wz-faint">
                already have an account?
                <NuxtLink to="/auth/signin" class="wz-accent hover:underline underline-offset-2">
                  sign in →
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
import { signUp, signIn } from '~/utils/auth-client'

definePageMeta({ layout: false, middleware: [] })

useSeoMeta({
  title: 'Sign Up - hypar',
  description: 'Create your hypar account and start exploring.',
  ogTitle: 'Sign Up - hypar',
  ogDescription: 'Create your hypar account and start exploring.',
  ogImage: '/hypar-chat-dark.png',
  twitterCard: 'summary_large_image',
})

const { theme, toggleTheme } = useTerminalPrefs()

const name = ref('')
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

async function registerWithEmail() {
  error.value = ''
  loadingEmail.value = true
  try {
    const { error: err } = await signUp.email({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    if (err) { error.value = err.message ?? 'Sign up failed'; return }
    await navigateTo('/')
  } finally {
    loadingEmail.value = false
  }
}

async function registerWith(provider: 'google' | 'github') {
  loadingProvider.value = provider
  await signIn.social({ provider, callbackURL: '/' })
}
</script>
