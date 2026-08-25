<template>
  <div class="max-w-4xl w-full mx-auto px-4 py-8">

    <!-- intro banner -->
    <section class="wz-panel mb-8">
      <div class="wz-panel-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="wz-accent">$</span>
          <span class="wz-label">{{ t('wizard.intro.title') }}</span>
        </div>
        <span class="wz-faint text-[11px]">{{ t('wizard.intro.subtitle') }}</span>
      </div>
    </section>

    <!-- step nav -->
    <nav class="mb-8 overflow-x-auto">
      <div class="flex items-center gap-1 text-[11px] whitespace-nowrap">
        <template v-for="(step, index) in allSteps" :key="step.id">
          <button
            type="button"
            :disabled="index > currentStep"
            class="px-2 py-1 rounded transition-colors"
            :class="[
              index === currentStep ? 'wz-pill' : '',
              index < currentStep ? 'wz-faint hover:opacity-100' : '',
              index > currentStep ? 'wz-faint cursor-not-allowed' : 'cursor-pointer',
            ]"
            @click="index <= currentStep ? currentStep = index : null"
          >
            <span v-if="index < currentStep">[✓ {{ pad(index + 1) }} {{ step.id }}]</span>
            <span v-else-if="index === currentStep">[● {{ pad(index + 1) }} {{ step.id }}]</span>
            <span v-else>[  {{ pad(index + 1) }} {{ step.id }} ]</span>
          </button>
        </template>
      </div>
    </nav>

    <!-- ── CONFIG STEPS 1-6 ── -->
    <template v-if="currentStep < wizardSteps.length">

      <!-- step header -->
      <section class="wz-panel mb-6">
        <div class="wz-panel-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="wz-accent">$</span>
            <span class="wz-label">{{ t('wizard.chrome.configCommand', { stepId: currentStepData.id }) }}</span>
          </div>
          <span class="wz-faint text-[11px]">{{ t('wizard.chrome.storageInfo') }}</span>
        </div>
        <div class="p-5">
          <h2 class="text-2xl font-bold wz-strong">// {{ tr(currentStepData.title) }}</h2>
          <p class="wz-muted text-sm mt-1">{{ tr(currentStepData.subtitle) }}</p>
        </div>
      </section>

      <!-- what / why -->
      <div class="grid md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="wz-panel p-4">
          <div class="text-[11px] uppercase tracking-widest wz-accent mb-2">// {{ t('wizard.chrome.what') }}</div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="wz-muted leading-relaxed prose-terminal" v-html="renderMarkdown(tr(currentStepData.whatWeAreBbuilding))" />
        </div>
        <div class="wz-panel p-4">
          <div class="text-[11px] uppercase tracking-widest wz-accent mb-2">// {{ t('wizard.chrome.why') }}</div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="wz-muted leading-relaxed prose-terminal" v-html="renderMarkdown(tr(currentStepData.whyWeNeedThis))" />
        </div>
      </div>

      <!-- key benefits -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <div
          v-for="(benefit, i) in currentStepData.keyBenefits"
          :key="i"
          class="wz-panel p-3 text-xs flex items-start gap-2"
        >
          <span class="wz-accent">+</span>
          <span class="wz-muted">{{ tr(benefit) }}</span>
        </div>
      </div>

      <!-- apis step: resolved env contract -->
      <div v-if="currentStepData.id === 'apis'" class="wz-panel p-3 mb-4 text-xs">
        <div class="flex items-center gap-2 mb-2">
          <span class="wz-faint">selected providers:</span>
          <span class="wz-pill">embedding={{ config.apis?.embeddingProvider ?? 'openai' }}</span>
          <span class="wz-pill">llm={{ config.apis?.llmProvider ?? 'anthropic' }}</span>
        </div>
        <div class="wz-faint text-[11px]">resolved env contract:</div>
        <pre class="text-[11px] mt-1 whitespace-pre-wrap wz-muted">{{ resolvedEnvContract }}</pre>
      </div>

      <!-- config form -->
      <div class="mb-6">
        <SetupWizardConfigForm
          :step-id="currentStepData.id"
          :fields="currentStepData.configFields ?? []"
          :model-value="config[currentStepData.id] ?? {}"
          :show-field-errors="wizardShowFieldErrorsByStep[currentStepData.id] ?? false"
          @update:model-value="onConfigChange(currentStepData.id, $event)"
          @valid-change="onValidChange"
        />
      </div>

      <!-- live .env preview -->
      <section v-if="envPreview" class="wz-panel mb-6">
        <div class="wz-panel-header flex items-center justify-between">
          <span class="wz-label">▾ {{ t('wizard.chrome.previewEnv') }}</span>
          <button type="button" class="wz-btn-ghost text-[11px]" @click="copyEnv">
            {{ envCopied ? `✓ ${t('wizard.chrome.copied')}` : `📋 ${t('wizard.chrome.copy')}` }}
          </button>
        </div>
        <pre class="p-4 text-[12px] leading-relaxed overflow-x-auto wz-muted">{{ envPreview }}</pre>
      </section>

      <!-- code snippet -->
      <section v-if="currentStepData.hasCodePreview && currentStepData.codeSnippet?.code" class="wz-panel mb-6">
        <div class="wz-panel-header flex items-center justify-between">
          <span class="wz-label">▾ {{ currentStepData.codeSnippet.filename }}</span>
          <span class="wz-faint text-[11px]">{{ currentStepData.codeSnippet.language }}</span>
        </div>
        <pre class="p-4 text-[12px] leading-relaxed overflow-x-auto wz-muted">{{ currentStepData.codeSnippet.code }}</pre>
        <p v-if="currentStepData.codeSnippet.explanation" class="px-4 pb-4 wz-faint text-xs italic">
          // {{ tr(currentStepData.codeSnippet.explanation) }}
        </p>
      </section>

    </template>

    <!-- ── ADMIN STEP (first run only) ── -->
    <div v-else class="wz-panel mb-6">
      <div class="wz-panel-header flex items-center gap-2">
        <span class="wz-accent">$</span>
        <span class="wz-label">create-admin-account</span>
      </div>
      <form class="p-6 space-y-4" @submit.prevent="submitSetup">
        <div class="space-y-1.5">
          <label class="text-[11px] uppercase tracking-widest wz-label">name</label>
          <input v-model="adminName" type="text" class="wz-input" placeholder="Admin User" required />
        </div>
        <div class="space-y-1.5">
          <label class="text-[11px] uppercase tracking-widest wz-label">email</label>
          <input v-model="adminEmail" type="email" class="wz-input" placeholder="admin@example.com" autocomplete="email" required />
        </div>
        <div class="space-y-1.5">
          <label class="text-[11px] uppercase tracking-widest wz-label">password</label>
          <input v-model="adminPassword" type="password" class="wz-input" placeholder="min. 8 characters" autocomplete="new-password" required minlength="8" />
        </div>
        <div
          v-if="setupError"
          class="text-xs px-3 py-2 rounded font-mono"
          style="color: var(--term-danger); background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25)"
        >
          ⚠ {{ setupError }}
        </div>
      </form>
    </div>

    <!-- next steps panel (last wizard step) -->
    <section v-if="currentStep === wizardSteps.length - 1" class="wz-panel mb-6">
      <div class="wz-panel-header flex items-center justify-between">
        <span class="wz-label">▾ {{ t('wizard.chrome.nextStepsTitle') }}</span>
        <button type="button" class="wz-btn-ghost text-[11px]" @click="copySetupCommands">
          {{ setupCopied ? `✓ ${t('wizard.chrome.setupCopied')}` : `📋 ${t('wizard.chrome.copySetup')}` }}
        </button>
      </div>
      <div class="p-4 text-xs space-y-3">
        <div
          class="wz-muted leading-relaxed border-l-2 pl-3 py-1"
          style="border-color: var(--term-accent)"
        >
          <span class="wz-strong text-[11px] block mb-1">{{ t('wizard.chrome.runtimeNoticeTitle') }}</span>
          <span>{{ t('wizard.chrome.runtimeNoticeBody') }}</span>
        </div>
        <p class="wz-muted">1) {{ t('wizard.chrome.stepCloneRepo') }}</p>
        <p class="wz-muted">2) {{ t('wizard.chrome.stepAddEnv') }}</p>
        <p class="wz-muted">3) {{ t('wizard.chrome.stepRestart') }}</p>
        <p class="wz-muted">4) {{ t('wizard.chrome.stepRunStack') }}</p>
        <pre class="mt-2 p-3 text-[11px] overflow-x-auto wz-faint" style="background: var(--term-bg-input); border: 1px solid var(--term-accent-line); border-radius: 6px;">{{ setupCommands }}</pre>
        <p
          v-if="applyOk"
          class="text-[11px] px-3 py-2 rounded font-mono"
          style="color: var(--term-accent); background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25)"
        >
          ✓ {{ t('wizard.chrome.applyRuntimeSuccess') }}
        </p>
        <p
          v-if="applyError"
          class="text-[11px] px-3 py-2 rounded font-mono"
          style="color: var(--term-danger); background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25)"
        >
          ⚠ {{ applyError }}
        </p>
      </div>
    </section>

    <!-- footer nav -->
    <div class="flex items-center justify-between mt-4 pb-8 text-xs">
      <button
        type="button"
        class="wz-btn-ghost"
        :class="currentStep === 0 ? 'opacity-30 cursor-not-allowed' : ''"
        :disabled="currentStep === 0"
        @click="previousStep"
      >
        ← {{ t('wizard.chrome.prev') }}
      </button>

      <div class="wz-faint text-[11px]">
        <span v-if="currentStep >= wizardSteps.length && !isCurrentValid">⚠ {{ t('wizard.chrome.requiredMissing') }}</span>
        <span v-else>✓ {{ t('wizard.chrome.ready') }}</span>
      </div>

      <!-- last wizard step: apply + download .env -->
      <template v-if="currentStep === wizardSteps.length - 1">
        <div class="flex flex-wrap items-center gap-2 justify-end">
          <button
            type="button"
            class="wz-btn-ghost"
            :disabled="applying"
            @click="applyToRunningServer"
          >
            {{ applying ? '…' : t('wizard.chrome.applyRuntime') }} ▶
          </button>
          <button type="button" class="wz-btn-primary" @click="completeWizard">
            {{ t('wizard.chrome.downloadEnv') }} ▶
          </button>
        </div>
      </template>
      <!-- admin creation step -->
      <template v-else-if="currentStep >= wizardSteps.length">
        <button
          v-if="!isAuthenticated"
          type="button"
          class="wz-btn-primary"
          :disabled="!isCurrentValid || submitting"
          @click="submitSetup"
        >
          {{ submitting ? '…' : 'create admin ▶' }}
        </button>
        <button v-else type="button" class="wz-btn-primary" @click="navigateTo('/')">
          done ▶
        </button>
      </template>
      <!-- regular next -->
      <template v-else>
        <button type="button" class="wz-btn-primary" @click="nextStep">
          {{ t('wizard.chrome.next') }} ▶
        </button>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { useI18n } from 'vue-i18n'
import { wizardSteps, buildEnvFile } from '~/utils/setup'
import type { WizardConfig, WizardStep } from '~/utils/setup'
import { useConfigRepository } from '~/composables/useConfigRepository'

definePageMeta({ middleware: [] })
useHead({ title: 'Setup - hypar' })

const { t, te } = useI18n()
const repo = useConfigRepository()
const { isAuthenticated } = useAuth()

const currentStep = ref(0)
const config = ref<WizardConfig>({})
const validByStep = ref<Record<string, boolean>>({})
/** After user clicks Next with an invalid step, show inline field errors for that step. */
const wizardShowFieldErrorsByStep = ref<Record<string, boolean>>({})
const envCopied = ref(false)
const setupCopied = ref(false)
const submitting = ref(false)
const setupError = ref('')
const applying = ref(false)
const applyError = ref('')
const applyOk = ref(false)
const adminName = ref('')
const adminEmail = ref('')
const adminPassword = ref('')

const ADMIN_STEP: WizardStep & { fields: [] } = {
  id: 'admin', order: 99, title: '', subtitle: '', icon: '',
  whatWeAreBbuilding: '', whyWeNeedThis: '', keyBenefits: [], fields: [],
}

const allSteps = computed(() =>
  isAuthenticated.value
    ? wizardSteps
    : [...wizardSteps, ADMIN_STEP as unknown as typeof wizardSteps[0]],
)

const currentStepData = computed(() => allSteps.value[currentStep.value] as WizardStep)

const envPreview = computed(() => currentStepData.value.envSnippet?.(config.value) ?? '')

const isCurrentValid = computed(() => {
  if (currentStep.value >= wizardSteps.length) {
    return adminName.value.trim().length > 0 && adminEmail.value.trim().length > 0 && adminPassword.value.length >= 8
  }
  return true
})

const resolvedEnvContract = computed(() => {
  const ep = config.value.apis?.embeddingProvider ?? 'openai'
  const lp = config.value.apis?.llmProvider ?? 'anthropic'
  const eMap: Record<string, { model: string; cred: string }> = {
    gemini: { model: 'gemini_embedding_model', cred: 'gemini_api_key' },
    openai: { model: 'openai_embedding_model', cred: 'openai_api_key' },
    voyage: { model: 'voyage_embedding_model', cred: 'voyage_api_key' },
    'ollama-local': { model: 'ollama_embedding_model', cred: 'ollama_base_url' },
  }
  const lMap: Record<string, { model: string; cred: string }> = {
    'ollama-cloud': { model: 'ollama_chat_model', cred: 'ollama_api_key' },
    openai: { model: 'openai_chat_model', cred: 'openai_api_key' },
    anthropic: { model: 'anthropic_model', cred: 'anthropic_api_key' },
    mistral: { model: 'mistral_model', cred: 'mistral_api_key' },
    'ollama-local': { model: 'ollama_chat_model', cred: 'ollama_base_url' },
  }
  const e = eMap[ep]; const l = lMap[lp]
  if (!e || !l) return ''
  return [
    `embedding_provider=${ep}`, `embedding_model <- ${e.model}`, `embedding_api_key <- ${e.cred}`,
    '', `llm_provider=${lp}`, `llm_model <- ${l.model}`, `llm_api_key <- ${l.cred}`,
  ].join('\n')
})

const setupCommands = computed(() => [
  'git clone <your-rag-repository-url>',
  'cd <your-rag-repository-folder>',
  'mv ~/Downloads/.env .env',
  'pnpm install',
  'docker compose up -d',
  'pnpm dev',
].join('\n'))

onMounted(async () => {
  const loaded = await repo.load()
  const seeded: WizardConfig = { ...loaded }
  for (const step of wizardSteps) {
    seeded[step.id] = { ...(seeded[step.id] ?? {}) }
    for (const field of step.configFields ?? []) {
      if (seeded[step.id][field.id] === undefined && field.defaultValue !== undefined) {
        seeded[step.id][field.id] = field.defaultValue
      }
    }
  }
  config.value = seeded
})

function tr(value?: string): string {
  if (!value) return ''
  return te(value) ? t(value) : value
}

function renderMarkdown(text: string): string {
  return marked.parse(text) as string
}

function pad(n: number) { return String(n).padStart(2, '0') }

function onConfigChange(stepId: string, stepConfig: Record<string, unknown>) {
  config.value = { ...config.value, [stepId]: stepConfig }
  void repo.save({ [stepId]: stepConfig })
}

function onValidChange(valid: boolean) {
  validByStep.value = { ...validByStep.value, [currentStepData.value.id]: valid }
}

function nextStep() {
  if (currentStep.value < wizardSteps.length) {
    const stepId = currentStepData.value.id
    const fields = currentStepData.value.configFields ?? []
    if (fields.length > 0 && validByStep.value[stepId] === false) {
      wizardShowFieldErrorsByStep.value = { ...wizardShowFieldErrorsByStep.value, [stepId]: true }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
  }
  if (currentStep.value < allSteps.value.length - 1) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function copyEnv() {
  await navigator.clipboard.writeText(envPreview.value)
  envCopied.value = true
  setTimeout(() => (envCopied.value = false), 1500)
}

async function copySetupCommands() {
  await navigator.clipboard.writeText(setupCommands.value)
  setupCopied.value = true
  setTimeout(() => (setupCopied.value = false), 1500)
}

function completeWizard() {
  const full = buildEnvFile(config.value)
  const blob = new Blob([full], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '.env'; a.click()
  URL.revokeObjectURL(url)
}

async function applyToRunningServer() {
  applyError.value = ''
  applyOk.value = false
  applying.value = true
  try {
    await $fetch('/api/setup/apply-wizard', {
      method: 'POST',
      body: { config: config.value },
    })
    applyOk.value = true
  } catch (err: unknown) {
    applyError.value = (err as { data?: { statusMessage?: string }; message?: string })?.data?.statusMessage
      ?? (err as { message?: string })?.message
      ?? t('wizard.chrome.applyRuntimeError')
  } finally {
    applying.value = false
  }
}

async function submitSetup() {
  setupError.value = ''
  submitting.value = true
  try {
    await $fetch('/api/setup/complete', {
      method: 'POST',
      body: { name: adminName.value.trim(), email: adminEmail.value.trim(), password: adminPassword.value },
    })
    await navigateTo('/auth/signin')
  } catch (err: unknown) {
    setupError.value = (err as { data?: { statusMessage?: string }; message?: string })?.data?.statusMessage
      ?? (err as { message?: string })?.message ?? 'Setup failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.prose-terminal :deep(strong) { color: var(--term-text-strong); font-weight: 600; }
.prose-terminal :deep(code) {
  background: var(--term-accent-soft);
  color: var(--term-text-strong);
  padding: 0 0.3rem;
  border-radius: 3px;
  border: 1px solid var(--term-accent-faint);
}
.prose-terminal :deep(p) { margin: 0.25rem 0; }
.prose-terminal :deep(ul) { margin: 0.5rem 0; padding-left: 0; list-style: none; }
.prose-terminal :deep(li) { margin: 0.15rem 0; padding-left: 1.1rem; position: relative; }
.prose-terminal :deep(li)::before { content: '→'; position: absolute; left: 0; color: var(--term-accent); }
</style>
