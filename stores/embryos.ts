import { defineStore } from 'pinia'

export type EmbryoState = 'LATENT' | 'GERMINATING' | 'GROWING' | 'MATURE' | 'FOSSIL'
export type EventInitiator = 'USER' | 'AGENT' | 'SYSTEM'
export type ConnectionType = 'REINFORCES' | 'CONTRADICTS' | 'EXTENDS' | 'RESURRECTS'
export type AgentNoteType = 'OBSERVATION' | 'PENDING_QUESTION' | 'PENDING_CONNECTION' | 'PENDING_FOSSIL'

export interface Tension {
  id: string
  embryoId: string
  question: string
  resolved: boolean
  raisedBy: EventInitiator
  resolvedAt: string | null
  createdAt: string
}

export interface AgentNote {
  id: string
  embryoId: string
  type: AgentNoteType
  content: string
  dismissed: boolean
  createdAt: string
}

export interface EmbryoSummary {
  id: string
  seed: string
  state: EmbryoState
  createdAt: string
  updatedAt: string
  fossilizedAt: string | null
  fossilReason: string | null
  tensions: Tension[]
  agentNotes: AgentNote[]
  _count: { events: number; connections: number; connectedTo: number }
}

export interface EmbryoDetail extends EmbryoSummary {
  events: Array<{
    id: string
    type: string
    initiatedBy: EventInitiator
    payload: Record<string, any> | null
    createdAt: string
  }>
  connections: Array<{
    id: string
    targetId: string
    type: ConnectionType
    detectedBy: EventInitiator
    confirmedByUser: boolean
    note: string | null
    target: { id: string; seed: string; state: EmbryoState }
  }>
  connectedTo: Array<{
    id: string
    sourceId: string
    type: ConnectionType
    detectedBy: EventInitiator
    confirmedByUser: boolean
    source: { id: string; seed: string; state: EmbryoState }
  }>
}

export const useEmbryoStore = defineStore('embryos', () => {
  const embryos = ref<EmbryoSummary[]>([])
  const current = ref<EmbryoDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const byState = computed(() => {
    const groups: Record<EmbryoState, EmbryoSummary[]> = {
      LATENT: [],
      GERMINATING: [],
      GROWING: [],
      MATURE: [],
      FOSSIL: [],
    }
    for (const e of embryos.value) {
      groups[e.state].push(e)
    }
    return groups
  })

  const alive = computed(() =>
    embryos.value.filter(e => e.state !== 'FOSSIL'),
  )

  async function fetchAll(state?: EmbryoState) {
    loading.value = true
    error.value = null
    try {
      const params = state ? { state } : {}
      embryos.value = await $fetch('/api/embryos', { params })
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to load embryos'
    }
    finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      current.value = await $fetch(`/api/embryos/${id}`)
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to load embryo'
    }
    finally {
      loading.value = false
    }
  }

  async function create(seed: string): Promise<EmbryoSummary | null> {
    try {
      const embryo = await $fetch<EmbryoSummary>('/api/embryos', {
        method: 'POST',
        body: { seed },
      })
      embryos.value.unshift(embryo)
      return embryo
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to create embryo'
      return null
    }
  }

  async function transition(id: string, state: Exclude<EmbryoState, 'FOSSIL'>) {
    try {
      await $fetch(`/api/embryos/${id}`, {
        method: 'PATCH',
        body: { action: 'transition', state },
      })
      const idx = embryos.value.findIndex(e => e.id === id)
      if (idx !== -1) embryos.value[idx]!.state = state
      if (current.value?.id === id) current.value.state = state
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to transition embryo'
    }
  }

  async function addTension(id: string, question: string): Promise<Tension | null> {
    try {
      const tension = await $fetch<Tension>(`/api/embryos/${id}`, {
        method: 'PATCH',
        body: { action: 'add_tension', question },
      })
      const idx = embryos.value.findIndex(e => e.id === id)
      if (idx !== -1) embryos.value[idx]!.tensions.push(tension)
      if (current.value?.id === id) current.value.tensions.push(tension)
      return tension
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to add tension'
      return null
    }
  }

  async function resolveTension(embryoId: string, tensionId: string) {
    try {
      await $fetch(`/api/embryos/${embryoId}`, {
        method: 'PATCH',
        body: { action: 'resolve_tension', tensionId },
      })
      const patchTension = (list: Tension[]) => {
        const t = list.find(t => t.id === tensionId)
        if (t) t.resolved = true
      }
      const idx = embryos.value.findIndex(e => e.id === embryoId)
      if (idx !== -1) patchTension(embryos.value[idx]!.tensions)
      if (current.value?.id === embryoId) patchTension(current.value.tensions)
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to resolve tension'
    }
  }

  async function fossilize(id: string, reason: string) {
    try {
      await $fetch(`/api/embryos/${id}/fossilize`, {
        method: 'POST',
        body: { reason },
      })
      const idx = embryos.value.findIndex(e => e.id === id)
      if (idx !== -1) {
        embryos.value[idx]!.state = 'FOSSIL'
        embryos.value[idx]!.fossilReason = reason
        embryos.value[idx]!.fossilizedAt = new Date().toISOString()
      }
      if (current.value?.id === id) {
        current.value.state = 'FOSSIL'
        current.value.fossilReason = reason
        current.value.fossilizedAt = new Date().toISOString()
      }
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to fossilize'
    }
  }

  async function connect(id: string, targetId: string, type: ConnectionType, note?: string) {
    try {
      const connection = await $fetch(`/api/embryos/${id}`, {
        method: 'PATCH',
        body: { action: 'connect', targetId, type, note },
      })
      if (current.value?.id === id) {
        current.value.connections.push(connection as any)
      }
      return connection
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to create connection'
      return null
    }
  }

  async function confirmConnection(embryoId: string, connectionId: string) {
    try {
      await $fetch(`/api/embryos/${embryoId}`, {
        method: 'PATCH',
        body: { action: 'confirm_connection', connectionId },
      })
      if (current.value?.id === embryoId) {
        const c = current.value.connections.find(c => c.id === connectionId)
        if (c) c.confirmedByUser = true
      }
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to confirm connection'
    }
  }

  async function dismissNote(embryoId: string, noteId: string) {
    try {
      await $fetch(`/api/embryos/${embryoId}`, {
        method: 'PATCH',
        body: { action: 'dismiss_note', noteId },
      })
      if (current.value?.id === embryoId) {
        current.value.agentNotes = current.value.agentNotes.filter(n => n.id !== noteId)
      }
      const idx = embryos.value.findIndex(e => e.id === embryoId)
      if (idx !== -1) {
        embryos.value[idx]!.agentNotes = embryos.value[idx]!.agentNotes.filter(n => n.id !== noteId)
      }
    }
    catch (e: any) {
      error.value = e?.data?.statusMessage ?? 'Failed to dismiss note'
    }
  }

  return {
    embryos,
    current,
    loading,
    error,
    byState,
    alive,
    fetchAll,
    fetchOne,
    create,
    transition,
    addTension,
    resolveTension,
    fossilize,
    connect,
    confirmConnection,
    dismissNote,
  }
})
