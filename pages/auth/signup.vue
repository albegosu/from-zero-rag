<template>
  <div class="terminal-theme min-h-screen" :class="{ 'theme-light': theme === 'light' }">
    <div class="wz-scanline app-backdrop min-h-screen flex flex-col">

      <header class="glass hairline-b px-4 h-12 flex items-center justify-between text-xs shrink-0">
        <div class="flex items-center gap-3">
          <BrandHyparMark />
          <span class="wz-strong font-semibold">hypar</span>
        </div>
        <button type="button" class="wz-btn-ghost wz-theme-toggle" @click="toggleTheme">
          {{ theme === 'light' ? '[ light ]' : '[ dark ]' }}
        </button>
      </header>

      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
          <div class="wz-panel">

            <div class="wz-panel-header flex items-center gap-2">
              <span class="wz-accent">$</span>
              <span class="wz-label">auth --signup</span>
            </div>

            <div class="p-6 space-y-5">
              <div class="space-y-1">
                <h1 class="text-base font-semibold wz-strong">// create account</h1>
                <p class="text-[11px] wz-faint">Join your workspace</p>
              </div>

              <div class="space-y-2">
                <button
                  type="button"
                  class="wz-btn-outline w-full justify-center"
                  :disabled="!!loadingProvider"
                  @click="registerWith('google')"
                >
                  {{ loadingProvider === 'google' ? '…' : '▸ continue with google' }}
                </button>
                <button
                  type="button"
                  class="wz-btn-outline w-full justify-center"
                  :disabled="!!loadingProvider"
                  @click="registerWith('github')"
                >
                  {{ loadingProvider === 'github' ? '…' : '▸ continue with github' }}
                </button>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex-1 h-px" style="background: var(--term-accent-line)" />
                <span class="text-[10px] wz-faint">── or ──</span>
                <div class="flex-1 h-px" style="background: var(--term-accent-line)" />
              </div>

              <form class="space-y-4" @submit.prevent="registerWithEmail">
                <div class="space-y-1.5">
                  <label class="text-[10px] uppercase tracking-widest wz-label">name</label>
                  <input
                    v-model="name"
                    type="text"
                    class="wz-input"
                    placeholder="Your name"
                    autocomplete="name"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] uppercase tracking-widest wz-label">email</label>
                  <input
                    v-model="email"
                    type="email"
                    class="wz-input"
                    placeholder="you@example.com"
                    autocomplete="email"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] uppercase tracking-widest wz-label">password</label>
                  <input
                    v-model="password"
                    type="password"
                    class="wz-input"
                    placeholder="Min. 8 characters"
                    autocomplete="new-password"
                    required
                  />
                </div>

                <div
                  v-if="error"
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
                  {{ loadingEmail ? '…' : 'create account ▶' }}
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

const { theme, toggleTheme } = useTerminalPrefs()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loadingEmail = ref(false)
const loadingProvider = ref<'google' | 'github' | null>(null)

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
