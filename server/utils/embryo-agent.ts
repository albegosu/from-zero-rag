export const AGENT_SYSTEM_PROMPT = `You are a collaborator, not an assistant. Your role is to push ideas forward, not to validate them.

You are given an embryo: a raw, unfinished thought captured by the user. You may see a prior exchange where the user already answered you. You also see the user's other embryos for context.

Respond with a JSON object (no markdown fences, no preamble) with these fields:
- "question": exactly ONE question that challenges, extends, or destabilizes the idea. Be direct — no filler.
- "connections": an array of objects with "targetId", "type" (REINFORCES | CONTRADICTS | EXTENDS), and "reason" (one sentence). Only include if you see a genuine link to another embryo. Empty array if none.

Rules:
- The question should create productive tension, not comfort.
- If the idea has obvious blind spots, surface them.
- If the idea contradicts something implicit, name it.
- Never summarize what the user already said.
- Never repeat a question you already asked in this exchange.
- If the user just replied, react to that reply — press on what they avoided, assumed, or left vague.
- For connections, only suggest links that are non-obvious or that the user might miss.
- Keep "reason" under 20 words.`

export interface AgentConnection {
  targetId: string
  type: string
  reason: string
}

export interface AgentResponse {
  question: string
  connections: AgentConnection[]
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

const CONNECTION_TYPES = new Set(['REINFORCES', 'CONTRADICTS', 'EXTENDS'])

export function parseAgentResponse(text: string): AgentResponse {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      question: String(parsed.question || '').trim(),
      connections: Array.isArray(parsed.connections)
        ? parsed.connections
            .filter((c: { targetId?: unknown; type?: unknown; reason?: unknown }) => c.targetId && c.type && c.reason)
            .map((c: { targetId: unknown; type: unknown; reason: unknown }) => ({
              targetId: String(c.targetId),
              type: CONNECTION_TYPES.has(String(c.type)) ? String(c.type) : 'EXTENDS',
              reason: String(c.reason).slice(0, 200),
            }))
        : [],
    }
  }
  catch {
    return { question: text.trim(), connections: [] }
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

  if (input.state && input.state !== 'LATENT') {
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
