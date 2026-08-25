import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { moveMatchesExpected, stanceFor } from '../utils/embryo-method'
import { buildAgentSystemPrompt } from '../server/utils/embryo-agent'

interface StanceFixture {
  seed: string
  state: string
  expectMove: string | string[]
  notes?: string
}

function loadFixtures(): StanceFixture[] {
  const path = resolve(process.cwd(), 'evals/embryo-stance.jsonl')
  return readFileSync(path, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as StanceFixture)
}

describe('embryo-stance eval fixtures', () => {
  const fixtures = loadFixtures()

  it('has the required cases', () => {
    const states = fixtures.map(f => f.state)
    expect(states).toEqual(expect.arrayContaining(['LATENT', 'GERMINATING', 'GROWING', 'MATURE']))
    expect(fixtures.some(f => /checklist/i.test(f.seed) && f.state === 'LATENT')).toBe(true)
  })

  it('does not use leftover RAG golden queries', () => {
    for (const f of fixtures) {
      expect(f.seed).not.toMatch(/RAG|hybrid search|embedding/i)
      expect('query' in f).toBe(false)
    }
  })

  it('preferred stance move matches expectMove for each fixture', () => {
    for (const f of fixtures) {
      const preferred = stanceFor(f.state).move
      expect(
        moveMatchesExpected(preferred, f.expectMove),
        `${f.state} preferred ${preferred} vs ${JSON.stringify(f.expectMove)} (${f.notes})`,
      ).toBe(true)
    }
  })

  it('system prompt for each fixture state names the preferred move and forbids teaching the method', () => {
    for (const f of fixtures) {
      const prompt = buildAgentSystemPrompt(f.state)
      const preferred = stanceFor(f.state).move
      expect(prompt).toContain(`Current embryo state: ${f.state}`)
      expect(prompt).toContain(`Preferred move: ${preferred}`)
      expect(prompt).toMatch(/solution, recipe, feature/i)
      expect(prompt).toMatch(/Never name Munari/)
    }
  })
})
