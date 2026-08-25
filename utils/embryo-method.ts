export const AGENT_MOVES = ['DEFINE', 'PROBE', 'INVERT', 'VARIETY', 'SIMPLEST'] as const
export type AgentMove = (typeof AGENT_MOVES)[number]

export const FOSSIL_KINDS = ['ILL_DEFINED', 'WRONG_PATH', 'SUPERSEDED'] as const
export type FossilKind = (typeof FOSSIL_KINDS)[number]

export const METHOD_COPY: Record<string, string> = {
  LATENT: 'waiting to name the real problem',
  GERMINATING: 'probing assumptions',
  GROWING: 'generating paths, not the answer',
  MATURE: 'tension resolved — close or reopen',
  FOSSIL: 'path closed, reason kept',
}

export const FOSSIL_KIND_COPY: Record<FossilKind, { label: string; starter: string }> = {
  ILL_DEFINED: {
    label: 'ill-defined problem',
    starter: 'the problem was ill-defined: ',
  },
  WRONG_PATH: {
    label: 'wrong path',
    starter: 'a simpler path existed: ',
  },
  SUPERSEDED: {
    label: 'superseded',
    starter: 'superseded by another idea: ',
  },
}

export interface MethodStance {
  move: AgentMove
  instruction: string
}

const STANCE_BY_STATE: Record<string, MethodStance> = {
  LATENT: {
    move: 'DEFINE',
    instruction: `Define the problem before anything else. If the seed reads as a solution, recipe, feature, or patch, recover the problem it is papering over. Ask what is ambiguous, what would count as a clear and neutral statement of the problem. Do not help implement the first idea.`,
  },
  GERMINATING: {
    move: 'PROBE',
    instruction: `Probe assumptions. Ask why, then why again, until the root is named — or invert: what would have to be true for this to be wrong? Do not generate solutions or paths yet. Prefer PROBE; use INVERT when the idea is confident and untested.`,
  },
  GROWING: {
    move: 'VARIETY',
    instruction: `Generate paths, not the answer. Creativity here is variety: alternative directions, not the clever first fix. The question should open or force a choice between paths. You MAY include 2–3 short paths (directions, not complete solutions). Do not pick a winner.`,
  },
  MATURE: {
    move: 'SIMPLEST',
    instruction: `Select the simplest effective form. Is remaining tension real, or is this ready to close? If it should close, you MAY propose fossil with kind ILL_DEFINED (problem was never named), WRONG_PATH (a simpler path existed), or SUPERSEDED (another idea replaced this). Do not fossilize — only propose.`,
  },
}

export function stanceFor(state: string): MethodStance {
  return STANCE_BY_STATE[state] ?? STANCE_BY_STATE.LATENT!
}

export function isAgentMove(value: unknown): value is AgentMove {
  return typeof value === 'string' && (AGENT_MOVES as readonly string[]).includes(value)
}

export function isFossilKind(value: unknown): value is FossilKind {
  return typeof value === 'string' && (FOSSIL_KINDS as readonly string[]).includes(value)
}

export function moveMatchesExpected(
  actual: string | undefined,
  expected: string | string[],
): boolean {
  if (!actual) return false
  const allowed = Array.isArray(expected) ? expected : [expected]
  return allowed.includes(actual)
}

export function formatFossilNote(kind: FossilKind, reason: string): string {
  return `${kind}: ${reason}`
}

export function parseFossilNote(content: string): { kind: FossilKind; reason: string } | null {
  const match = content.match(/^(ILL_DEFINED|WRONG_PATH|SUPERSEDED):\s*(.+)$/s)
  if (!match) return null
  return { kind: match[1] as FossilKind, reason: match[2]!.trim() }
}

export function scoreStanceRun(
  results: Array<{ expectMove: string | string[]; actualMove?: string }>,
): { hit: number; total: number } {
  let hit = 0
  for (const row of results) {
    if (moveMatchesExpected(row.actualMove, row.expectMove)) hit += 1
  }
  return { hit, total: results.length }
}
