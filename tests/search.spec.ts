import { describe, it, expect } from 'vitest'
import {
  cosineSim,
  parsePgVector,
  mmrRank,
  type SearchResult,
} from '../server/utils/search.service'

describe('cosineSim', () => {
  it('identical vectors → 1', () => {
    expect(cosineSim([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
  })
  it('orthogonal → 0', () => {
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0)
  })
  it('opposite → -1', () => {
    expect(cosineSim([1, 0], [-1, 0])).toBeCloseTo(-1)
  })
  it('mismatched length → 0 (defensive)', () => {
    expect(cosineSim([1, 0, 0], [1, 0])).toBe(0)
  })
  it('empty vectors → 0', () => {
    expect(cosineSim([], [])).toBe(0)
  })
})

describe('parsePgVector', () => {
  it('parses a pgvector text literal', () => {
    expect(parsePgVector('[1,2,3.5]')).toEqual([1, 2, 3.5])
  })
  it('tolerates surrounding whitespace', () => {
    expect(parsePgVector('  [0.1, 0.2]  ')).toEqual([0.1, 0.2])
  })
  it('drops non-finite pieces instead of emitting NaN', () => {
    expect(parsePgVector('[1,foo,3]')).toEqual([1, 3])
  })
  it('empty / blank input → []', () => {
    expect(parsePgVector('')).toEqual([])
    expect(parsePgVector('[]')).toEqual([])
  })
})

describe('mmrRank — relevance vs. diversity tradeoff', () => {
  // q ~ [1,0,0]. A1/A2 are near-duplicates both highly relevant to q;
  // B is less relevant to q but points in a different direction (diverse).
  const q = [1, 0, 0]
  const make = (chunkId: string, embedding: number[]): SearchResult => ({
    chunkId,
    content: chunkId,
    documentId: `doc-${chunkId}`,
    documentTitle: chunkId,
    score: cosineSim(q, embedding),
    startChar: 0,
    endChar: 0,
    embedding,
  })
  const A1 = make('A1', [0.99, 0.10, 0])
  const A2 = make('A2', [0.99, 0.11, 0]) // near-identical to A1
  const B = make('B', [0.70, 0, 0.70]) // diverse direction
  const candidates = [A1, A2, B]

  it('pure relevance (λ=1) keeps the two most similar — even if redundant', () => {
    const ids = mmrRank(q, candidates, 2, 1).map((r) => r.chunkId)
    expect(ids).toEqual(['A1', 'A2'])
  })

  it('diversity-weighted (λ=0.2) drops the redundant near-duplicate for a diverse chunk', () => {
    const ids = mmrRank(q, candidates, 2, 0.2).map((r) => r.chunkId)
    expect(ids).toEqual(['A1', 'B'])
  })

  it('always picks the single most query-relevant chunk first', () => {
    expect(mmrRank(q, candidates, 1, 0.5)[0].chunkId).toBe('A1')
  })

  it('returns at most k results and never more than available', () => {
    expect(mmrRank(q, candidates, 2, 0.7)).toHaveLength(2)
    expect(mmrRank(q, candidates, 99, 0.7)).toHaveLength(3)
  })

  it('falls back to the stored score when an embedding is missing', () => {
    const noEmb: SearchResult = { ...A1, chunkId: 'NE', embedding: undefined, score: 0.95 }
    const ranked = mmrRank(q, [noEmb, B], 2, 1)
    // NE has the higher fallback relevance, so it is selected first
    expect(ranked[0].chunkId).toBe('NE')
  })
})
