<template>
  <div class="max-w-3xl mx-auto px-4 py-6 pb-28">
    <div class="mb-6">
      <h1 class="text-lg font-semibold wz-strong">{{ t('settings.title') }}</h1>
      <p class="text-xs wz-faint mt-1">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="space-y-4">
      <!-- Tab nav -->
      <div class="flex gap-1 text-xs flex-wrap">
        <button
          v-for="tab in SETTINGS_TABS"
          :key="tab.id"
          class="px-3 py-1.5 rounded transition-colors duration-150"
          :class="activeTab === tab.id ? 'wz-btn-outline font-semibold' : 'wz-btn-ghost'"
          :disabled="loadingTab"
          @click="onSwitchTab(tab.id)"
        >
          {{ t(`settings.tabs.${tab.id}`) }}
        </button>
      </div>

      <!-- Status banner -->
      <div
        v-if="saveStatus"
        role="status"
        class="wz-flash"
        :class="saveStatus.ok ? 'wz-flash--ok' : 'wz-flash--err'"
      >
        <span class="wz-flash__icon" aria-hidden="true">
          <UIcon
            :name="saveStatus.ok ? 'i-heroicons-check' : 'i-heroicons-x-mark'"
            class="size-2"
          />
        </span>
        <p class="min-w-0 pt-0.5 m-0 font-medium tracking-tight">
          {{ saveStatus.message }}
        </p>
      </div>

      <div v-if="loadingTab" class="text-xs wz-faint py-4 text-center">{{ t('common.loading') }}</div>

      <!-- Config form for active tab -->
      <div v-else-if="currentStep" class="space-y-4">
        <SetupWizardConfigForm
          :step-id="currentStep.id"
          :fields="currentFields"
          :model-value="formValues"
          @update:model-value="formValues = $event"
        />
        <div class="flex justify-end gap-2 mt-2">
          <button class="wz-btn-ghost text-xs" :disabled="saving" @click="resetTab">
            {{ t('settings.reset') }}
          </button>
          <button class="wz-btn-primary text-xs" :disabled="saving" @click="saveTab">
            {{ saving ? t('settings.saving') : t('settings.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  SETTINGS_TABS,
  useSettingsTabs,
  type SettingsTabId,
} from '~/composables/useSettingsTabs'
import { buildWizardDefaults, getStepFields, parseFieldValue } from '~/utils/settings-form'
definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Admin Settings - hypar' })

const { t } = useI18n()

const saving = ref(false)
const saveStatus = ref<{ ok: boolean; message: string } | null>(null)

const {
  activeTab,
  loadingTab,
  formValues,
  loadedValues,
  currentStep,
  currentFields,
  switchTab,
  invalidateAndReload,
} = useSettingsTabs({
  fetchUrl: (tabId) => `/api/admin/settings?category=${tabId}`,
  parseResponse(data, step) {
    const apiData = data as Record<string, string>
    const defaults = buildWizardDefaults(step)
    const overlay: Record<string, unknown> = {}
    for (const field of getStepFields(step)) {
      const raw = field.envKey ? apiData[field.envKey] : undefined
      if (raw !== undefined && raw !== '') {
        overlay[field.id] = parseFieldValue(raw, field.type)
      }
    }
    return { formValues: { ...defaults, ...overlay } }
  },
})

function onSwitchTab(id: SettingsTabId) {
  saveStatus.value = null
  switchTab(id)
}

async function saveTab() {
  const step = currentStep.value
  if (!step) return
  saving.value = true
  saveStatus.value = null
  try {
    await Promise.all(
      getStepFields(step)
        .filter((field) => field.envKey)
        .filter((field) => {
          if (!field.dependsOn) return true
          return formValues.value[field.dependsOn.field] === field.dependsOn.equals
        })
        .map((field) => {
          const val = formValues.value[field.id]
          const value = Array.isArray(val) ? (val as string[]).join(',') : String(val ?? '')
          return $fetch('/api/admin/settings', {
            method: 'POST',
            body: { key: field.envKey, value, category: activeTab.value },
          })
        }),
    )
    loadedValues.value[activeTab.value] = { ...formValues.value }
    saveStatus.value = {
      ok: true,
      message: t('settings.savedOk', { section: t(`settings.tabs.${activeTab.value}`) }),
    }
  } catch {
    saveStatus.value = { ok: false, message: t('settings.savedFail') }
  } finally {
    saving.value = false
  }
}

async function resetTab() {
  const step = currentStep.value
  if (!step) return
  saving.value = true
  saveStatus.value = null
  try {
    await Promise.all(
      getStepFields(step)
        .filter((field) => field.envKey)
        .map((field) =>
          $fetch('/api/admin/settings', {
            method: 'POST',
            body: { key: field.envKey, value: '', category: activeTab.value },
          }),
        ),
    )
    await invalidateAndReload()
    saveStatus.value = { ok: true, message: t('settings.resetOk') }
  } catch {
    saveStatus.value = { ok: false, message: t('settings.resetFail') }
  } finally {
    saving.value = false
  }
}
</script>
