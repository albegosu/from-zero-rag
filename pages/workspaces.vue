<template>
  <div class="max-w-2xl mx-auto px-4 py-8 text-xs">
    <h1 class="wz-strong text-sm font-semibold mb-6">workspaces</h1>

    <!-- list -->
    <div v-for="ws in workspaces" :key="ws.id" class="mb-4 border border-[var(--wz-border)] rounded p-3">
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <span class="wz-strong font-semibold">{{ ws.name }}</span>
          <span class="ml-2 wz-faint">[ {{ ws.role }} ]</span>
          <span v-if="ws.active" class="ml-2 wz-accent">● active</span>
        </div>
        <button
          v-if="!ws.active"
          type="button"
          class="wz-btn-ghost text-[11px] shrink-0 whitespace-nowrap"
          :disabled="activating === ws.id"
          @click="activate(ws.id)"
        >
          {{ activating === ws.id ? '…' : '[ activate ]' }}
        </button>
      </div>

      <!-- allowed formats -->
      <div class="mt-3 space-y-2">
        <p v-if="ws.effectiveFormats" class="wz-faint text-[11px]">
          {{ t('workspaces.allowedFormatsEffective', { formats: ws.effectiveFormats }) }}
        </p>
        <template v-if="ws.role === 'owner' || ws.role === 'editor'">
          <label class="wz-label text-[11px] block">{{ t('workspaces.allowedFormatsLabel') }}</label>
          <input
            v-model="formatsInput[ws.id]"
            class="wz-input w-full text-[11px] h-7"
            placeholder="pdf,md,txt,xls,xlsx"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="wz-btn-ghost text-[11px]"
              :disabled="savingFormats === ws.id"
              @click="saveFormats(ws.id)"
            >
              {{ savingFormats === ws.id ? '…' : t('workspaces.allowedFormatsSave') }}
            </button>
            <button
              type="button"
              class="wz-btn-ghost text-[11px]"
              :disabled="savingFormats === ws.id"
              @click="clearFormats(ws.id)"
            >
              {{ t('workspaces.allowedFormatsClear') }}
            </button>
          </div>
        </template>
        <p v-else-if="ws.effectiveFormats" class="wz-faint text-[11px]">
          {{ t('workspaces.allowedFormatsViewer', { formats: ws.effectiveFormats }) }}
        </p>
        <p v-if="formatsError[ws.id]" class="text-red-500 text-[11px]">{{ formatsError[ws.id] }}</p>
      </div>

      <!-- invite (owners only) -->
      <div v-if="ws.role === 'owner'" class="mt-3 flex gap-2">
        <input
          v-model="inviteEmail[ws.id]"
          class="wz-input flex-1 text-[11px] h-7"
          placeholder="email to invite"
          type="email"
        />
        <button
          type="button"
          class="wz-btn-ghost text-[11px] shrink-0 whitespace-nowrap"
          :disabled="inviting === ws.id"
          @click="invite(ws.id)"
        >
          {{ inviting === ws.id ? '…' : '[ invite ]' }}
        </button>
      </div>
      <p v-if="inviteError[ws.id]" class="mt-1 text-red-500 text-[11px]">{{ inviteError[ws.id] }}</p>
    </div>

    <!-- create new -->
    <div class="mt-6 border border-[var(--wz-border)] rounded p-3">
      <p class="wz-faint mb-2">create workspace</p>
      <div class="flex gap-2">
        <input v-model="newName" class="wz-input flex-1 text-[11px] h-7" placeholder="workspace name" />
        <button type="button" class="wz-btn-ghost text-[11px] shrink-0 whitespace-nowrap" :disabled="creating" @click="create">
          {{ creating ? '…' : '[ create ]' }}
        </button>
      </div>
      <p v-if="createError" class="mt-1 text-red-500 text-[11px]">{{ createError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatsToDisplay } from '~/utils/allowed-formats'

useHead({ title: 'Workspaces - hypar' })
const { t } = useI18n()

interface Workspace {
  id: string
  name: string
  role: string
  active: boolean
  effectiveFormats?: string
}

const workspaces = ref<Workspace[]>([])
const activating = ref<string | null>(null)
const inviting = ref<string | null>(null)
const inviteEmail = ref<Record<string, string>>({})
const inviteError = ref<Record<string, string>>({})
const formatsInput = ref<Record<string, string>>({})
const formatsError = ref<Record<string, string>>({})
const savingFormats = ref<string | null>(null)
const newName = ref('')
const creating = ref(false)
const createError = ref('')

async function loadWorkspaceFormats(ws: Workspace) {
  try {
    const data = await $fetch<Record<string, string>>(`/api/workspaces/${ws.id}/settings?category=chunking`)
    const effective = data.effective_ALLOWED_FORMATS ?? ''
    ws.effectiveFormats = effective
      ? formatsToDisplay(effective.split(',').map((f) => f.trim()).filter(Boolean))
      : undefined
    formatsInput.value[ws.id] = data.ALLOWED_FORMATS ?? ''
  } catch {
    formatsError.value[ws.id] = 'Could not load formats'
  }
}

async function load() {
  const list = await $fetch<Workspace[]>('/api/workspaces')
  workspaces.value = list
  await Promise.all(list.map((ws) => loadWorkspaceFormats(ws)))
}

async function activate(id: string) {
  activating.value = id
  await $fetch(`/api/workspaces/${id}/activate`, { method: 'POST' })
  window.location.reload()
}

async function saveFormats(wsId: string) {
  formatsError.value[wsId] = ''
  savingFormats.value = wsId
  try {
    await $fetch(`/api/workspaces/${wsId}/settings`, {
      method: 'POST',
      body: {
        key: 'ALLOWED_FORMATS',
        value: formatsInput.value[wsId] ?? '',
        category: 'chunking',
      },
    })
    const ws = workspaces.value.find((w) => w.id === wsId)
    if (ws) await loadWorkspaceFormats(ws)
  } catch (e: unknown) {
    const msg =
      (e as { data?: { statusMessage?: string; message?: string } })?.data?.statusMessage
      ?? (e as { data?: { message?: string } })?.data?.message
      ?? 'Error saving formats'
    formatsError.value[wsId] = msg
  } finally {
    savingFormats.value = null
  }
}

async function clearFormats(wsId: string) {
  formatsError.value[wsId] = ''
  savingFormats.value = wsId
  try {
    await $fetch(`/api/workspaces/${wsId}/settings`, {
      method: 'POST',
      body: { key: 'ALLOWED_FORMATS', value: '', category: 'chunking' },
    })
    formatsInput.value[wsId] = ''
    const ws = workspaces.value.find((w) => w.id === wsId)
    if (ws) await loadWorkspaceFormats(ws)
  } catch (e: unknown) {
    const msg =
      (e as { data?: { statusMessage?: string; message?: string } })?.data?.statusMessage
      ?? (e as { data?: { message?: string } })?.data?.message
      ?? 'Error clearing formats'
    formatsError.value[wsId] = msg
  } finally {
    savingFormats.value = null
  }
}

async function invite(wsId: string) {
  inviteError.value[wsId] = ''
  inviting.value = wsId
  try {
    await $fetch(`/api/workspaces/${wsId}/members`, {
      method: 'POST',
      body: { email: inviteEmail.value[wsId] },
    })
    inviteEmail.value[wsId] = ''
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? 'Error inviting user'
    inviteError.value[wsId] = msg
  } finally {
    inviting.value = null
  }
}

async function create() {
  createError.value = ''
  if (!newName.value.trim()) return
  creating.value = true
  try {
    await $fetch('/api/workspaces', { method: 'POST', body: { name: newName.value.trim() } })
    newName.value = ''
    await load()
  } catch (e: unknown) {
    createError.value = (e as { data?: { message?: string } })?.data?.message ?? 'Error creating workspace'
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>
