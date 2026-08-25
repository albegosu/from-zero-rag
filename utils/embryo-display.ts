import type { ConnectionType, EmbryoState } from '~/stores/embryos'

export const LIFECYCLE: Array<{ state: EmbryoState; label: string; glyph: string }> = [
  { state: 'LATENT', label: 'latent', glyph: '◌' },
  { state: 'GERMINATING', label: 'germinating', glyph: '◎' },
  { state: 'GROWING', label: 'growing', glyph: '●' },
  { state: 'MATURE', label: 'mature', glyph: '◉' },
  { state: 'FOSSIL', label: 'fossil', glyph: '◈' },
]

export const CONNECTION_TYPES: Array<{ value: ConnectionType; label: string; glyph: string }> = [
  { value: 'REINFORCES', label: 'reinforces', glyph: '⟶' },
  { value: 'CONTRADICTS', label: 'contradicts', glyph: '⟷' },
  { value: 'EXTENDS', label: 'extends', glyph: '⤴' },
  { value: 'RESURRECTS', label: 'resurrects', glyph: '↺' },
]

export function stateColor(state: EmbryoState) {
  return {
    LATENT: 'text-[var(--term-text-faint)]',
    GERMINATING: 'text-[var(--term-accent)]',
    GROWING: 'text-[var(--term-accent-strong)]',
    MATURE: 'text-[var(--term-text-strong)]',
    FOSSIL: 'text-[var(--term-text-dim)]',
  }[state]
}

export function parseConnectionNote(content: string): { type: string; targetId: string; reason: string } | null {
  const match = content.match(/^(\w+)\s+\[([^\]]+)\]:\s*(.+)$/)
  if (!match) return null
  return { type: match[1]!, targetId: match[2]!, reason: match[3]! }
}

export function truncateSeed(seed: string, max = 42) {
  const t = seed.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function appendTranscript(current: string, transcript: string) {
  const next = transcript.trim()
  if (!next) return current
  const cur = current.trim()
  return cur ? `${cur} ${next}` : next
}
