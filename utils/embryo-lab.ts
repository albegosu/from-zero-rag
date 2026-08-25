export const EMBRYO_STATES = ['LATENT', 'GERMINATING', 'GROWING', 'MATURE', 'FOSSIL'] as const
export type EmbryoStateName = typeof EMBRYO_STATES[number]

export const LIVING_STATES = ['LATENT', 'GERMINATING', 'GROWING', 'MATURE'] as const

export const AGENT_CONNECTION_TYPES = ['REINFORCES', 'CONTRADICTS', 'EXTENDS', 'RESURRECTS'] as const

export function isEmbryoState(value: unknown): value is EmbryoStateName {
  return typeof value === 'string' && (EMBRYO_STATES as readonly string[]).includes(value)
}

/** Returns the state if valid; `undefined` if absent; throws via sentinel for invalid. */
export function parseEmbryoStateParam(value: unknown): EmbryoStateName | undefined {
  if (value == null || value === '') return undefined
  if (isEmbryoState(value)) return value
  throw new Error('Invalid embryo state')
}

export function shouldAutoGerminate(state: string): boolean {
  return state === 'LATENT'
}

export type AgentPeer = { id: string; seed: string; state: string }

export function selectAgentPeers(opts: {
  living: AgentPeer[]
  fossils: AgentPeer[]
  alreadyConnected: Iterable<string>
  livingLimit?: number
  fossilLimit?: number
}): AgentPeer[] {
  const connected = new Set(opts.alreadyConnected)
  const livingLimit = opts.livingLimit ?? 15
  const fossilLimit = opts.fossilLimit ?? 5
  const living = opts.living.filter(e => !connected.has(e.id)).slice(0, livingLimit)
  const fossils = opts.fossils.filter(e => !connected.has(e.id)).slice(0, fossilLimit)
  return [...living, ...fossils]
}

export function connectionsToPersist<T extends { targetId: string }>(
  parsed: T[],
  validTargetIds: Iterable<string>,
): T[] {
  const valid = new Set(validTargetIds)
  const seen = new Set<string>()
  const out: T[] = []
  for (const c of parsed) {
    if (!valid.has(c.targetId) || seen.has(c.targetId)) continue
    seen.add(c.targetId)
    out.push(c)
  }
  return out
}

export type FossilStratum = 'recent' | 'mid' | 'deep'

const DAY = 86_400_000

export function fossilStratum(fossilizedAt: string | Date | null | undefined, now = Date.now()): FossilStratum {
  if (!fossilizedAt) return 'deep'
  const age = now - new Date(fossilizedAt).getTime()
  if (!Number.isFinite(age) || age < 7 * DAY) return 'recent'
  if (age < 30 * DAY) return 'mid'
  return 'deep'
}

export const FOSSIL_STRATUM_COPY: Record<FossilStratum, { label: string; depth: string }> = {
  recent: { label: 'near surface', depth: 'closed within a week' },
  mid: { label: 'buried', depth: 'closed within a month' },
  deep: { label: 'deep strata', depth: 'older than a month' },
}

export const EMBRYO_LIST_INCLUDE = {
  tensions: { where: { resolved: false } },
  agentNotes: { where: { dismissed: false } },
  _count: { select: { events: true, connections: true, connectedTo: true } },
} as const
