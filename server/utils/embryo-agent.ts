import {
  isAgentMove,
  isFossilKind,
  stanceFor,
  type AgentMove,
  type FossilKind,
} from '../../utils/embryo-method'
import { AGENT_CONNECTION_TYPES } from '../../utils/embryo-lab'

export { extractPartialQuestion } from '../../utils/embryo-stream'
export type { AgentMove, FossilKind }

const BASE_PROMPT = `You are a collaborator, not an assistant. Your role is to push ideas forward, not to validate them.

You are given an embryo: a raw, unfinished thought captured by the user. You may see a prior exchange where the user already answered you. You also see the user's other living embryos and a few fossils for context.

Respond with a JSON object (no markdown fences, no preamble) with these fields:
- "question": exactly ONE question that challenges, extends, or destabilizes the idea. Be direct — no filler.
- "move": DEFINE | PROBE | INVERT | VARIETY | SIMPLEST — the move you actually used.
- "connections": an array of objects with "targetId", "type" (REINFORCES | CONTRADICTS | EXTENDS | RESURRECTS), and "reason" (one sentence). Only include if you see a genuine link to another embryo. Use RESURRECTS only when the target is a FOSSIL. Empty array if none.
- "paths": an array of 0–3 short alternative directions (not complete solutions). Only when the state is GROWING. Empty array otherwise.
- "fossil": null, or {"kind":"ILL_DEFINED"|"WRONG_PATH"|"SUPERSEDED","reason":"..."} only when the state is MATURE and the embryo looks ready to close. Do not propose fossil in other states.

Rules:
- Follow the stance for the current state. Prefer the preferred move named below.
- If the seed reads as a solution, recipe, feature, checklist, or patch, DEFINE: recover the problem it is papering over. Do not help implement the first idea.
- The question should create productive tension, not comfort.
- If the idea has obvious blind spots, surface them.
- If the idea contradicts something implicit, name it.
- Never summarize what the user already said.
- Never repeat a question you already asked in this exchange.
- If the user just replied, react to that reply — press on what they avoided, assumed, or left vague.
- For connections, only suggest links that are non-obvious or that the user might miss.
- Keep "reason" under 20 words.
- Paths are directions that lead to options, not the option itself.
- Never name Munari, Design Thinking, or a method in the question. The method is how you think, not what you say.`

export function buildAgentSystemPrompt(state: string): string {
  const stance = stanceFor(state)
  return `${BASE_PROMPT}

Current embryo state: ${state}
Preferred move: ${stance.move}
Stance: ${stance.instruction}`
}

/** @deprecated Use buildAgentSystemPrompt(state). Kept for callers that have no state yet. */
export const AGENT_SYSTEM_PROMPT = buildAgentSystemPrompt('LATENT')

export interface AgentConnection {
  targetId: string
  type: string
  reason: string
}

export interface AgentFossilProposal {
  kind: FossilKind
  reason: string
}

export interface AgentResponse {
  question: string
  move?: AgentMove
  connections: AgentConnection[]
  paths: string[]
  fossil: AgentFossilProposal | null
}

export interface AgentDialogueTurn {
  role: 'agent' | 'user'
  text: string
}

export interface AgentPromptInput {
  seed: string
  state: string
  openTensions: string[]
  otherEmbryos: Array<{ id: string; seed: string; state: string }>
  dialogue: AgentDialogueTurn[]
}

const CONNECTION_TYPES = new Set<string>(AGENT_CONNECTION_TYPES)

function parsePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map(p => String(p ?? '').trim())
    .filter(Boolean)
    .slice(0, 3)
}

function parseFossil(value: unknown): AgentFossilProposal | null {
  if (!value || typeof value !== 'object') return null
  const rec = value as Record<string, unknown>
  const kind = rec.kind
  const reason = String(rec.reason ?? '').trim()
  if (!isFossilKind(kind) || !reason) return null
  return { kind, reason: reason.slice(0, 400) }
}

export function parseAgentResponse(text: string): AgentResponse {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    const moveRaw = parsed.move
    return {
      question: String(parsed.question || '').trim(),
      move: isAgentMove(moveRaw) ? moveRaw : undefined,
      connections: Array.isArray(parsed.connections)
        ? parsed.connections
            .filter((c: { targetId?: unknown; type?: unknown; reason?: unknown }) => c.targetId && c.type && c.reason)
            .map((c: { targetId: unknown; type: unknown; reason: unknown }) => ({
              targetId: String(c.targetId),
              type: CONNECTION_TYPES.has(String(c.type)) ? String(c.type) : 'EXTENDS',
              reason: String(c.reason).slice(0, 200),
            }))
        : [],
      paths: parsePaths(parsed.paths),
      fossil: parseFossil(parsed.fossil),
    }
  }
  catch {
    return { question: text.trim(), connections: [], paths: [], fossil: null }
  }
}

export function dialogueFromEvents(
  events: Array<{ type: string; payload?: unknown }>,
): AgentDialogueTurn[] {
  const turns: AgentDialogueTurn[] = []
  for (const ev of events) {
    const payload = ev.payload && typeof ev.payload === 'object'
      ? ev.payload as Record<string, unknown>
      : null
    if (ev.type === 'AGENT_QUESTION') {
      const question = String(payload?.question ?? '').trim()
      if (question) turns.push({ role: 'agent', text: question })
    }
    if (ev.type === 'USER_RESPONSE') {
      const reply = String(payload?.reply ?? '').trim()
      if (reply) turns.push({ role: 'user', text: reply })
    }
  }
  return turns
}

export function buildAgentUserMessage(input: AgentPromptInput): string {
  const parts = [`Embryo: ${input.seed}`]

  if (input.state) {
    parts.push(`Current state: ${input.state}`)
  }

  if (input.openTensions.length > 0) {
    parts.push(`Open tensions:\n${input.openTensions.map(t => `- ${t}`).join('\n')}`)
  }

  if (input.dialogue.length > 0) {
    const lines = input.dialogue.map((turn) => {
      const who = turn.role === 'agent' ? 'You asked' : 'User replied'
      return `${who}: ${turn.text}`
    })
    parts.push(`Prior exchange:\n${lines.join('\n')}`)
  }

  if (input.otherEmbryos.length > 0) {
    const list = input.otherEmbryos
      .map(e => `- [${e.id}] ${e.seed} (${e.state})`)
      .join('\n')
    parts.push(`Other embryos in the garden:\n${list}`)
  }

  return parts.join('\n\n')
}
