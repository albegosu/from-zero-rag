import { describe, it, expect } from 'vitest'
import {
  connectionsToPersist,
  fossilStratum,
  parseEmbryoStateParam,
  selectAgentPeers,
  shouldAutoGerminate,
} from '../utils/embryo-lab'

describe('parseEmbryoStateParam', () => {
  it('returns undefined when absent', () => {
    expect(parseEmbryoStateParam(undefined)).toBeUndefined()
    expect(parseEmbryoStateParam('')).toBeUndefined()
  })

  it('returns a valid state', () => {
    expect(parseEmbryoStateParam('LATENT')).toBe('LATENT')
    expect(parseEmbryoStateParam('FOSSIL')).toBe('FOSSIL')
  })

  it('throws on garbage', () => {
    expect(() => parseEmbryoStateParam('nope')).toThrow(/Invalid embryo state/)
  })
})

describe('shouldAutoGerminate', () => {
  it('is true only for LATENT', () => {
    expect(shouldAutoGerminate('LATENT')).toBe(true)
    expect(shouldAutoGerminate('GERMINATING')).toBe(false)
    expect(shouldAutoGerminate('FOSSIL')).toBe(false)
  })
})

describe('selectAgentPeers', () => {
  it('takes living then fossils and skips already-connected ids', () => {
    const living = [
      { id: 'a', seed: 'A', state: 'GROWING' },
      { id: 'b', seed: 'B', state: 'MATURE' },
    ]
    const fossils = [
      { id: 'f1', seed: 'old', state: 'FOSSIL' },
      { id: 'f2', seed: 'older', state: 'FOSSIL' },
    ]
    const peers = selectAgentPeers({
      living,
      fossils,
      alreadyConnected: ['b'],
      livingLimit: 15,
      fossilLimit: 5,
    })
    expect(peers.map(p => p.id)).toEqual(['a', 'f1', 'f2'])
  })

  it('caps living and fossil slices', () => {
    const living = Array.from({ length: 4 }, (_, i) => ({ id: `l${i}`, seed: `L${i}`, state: 'GROWING' }))
    const fossils = Array.from({ length: 4 }, (_, i) => ({ id: `f${i}`, seed: `F${i}`, state: 'FOSSIL' }))
    const peers = selectAgentPeers({ living, fossils, alreadyConnected: [], livingLimit: 2, fossilLimit: 1 })
    expect(peers.map(p => p.id)).toEqual(['l0', 'l1', 'f0'])
  })
})

describe('connectionsToPersist', () => {
  it('drops unknown targets and duplicate target ids', () => {
    const parsed = [
      { targetId: 'a', type: 'EXTENDS' },
      { targetId: 'missing', type: 'CONTRADICTS' },
      { targetId: 'a', type: 'REINFORCES' },
      { targetId: 'b', type: 'RESURRECTS' },
    ]
    expect(connectionsToPersist(parsed, ['a', 'b'])).toEqual([
      { targetId: 'a', type: 'EXTENDS' },
      { targetId: 'b', type: 'RESURRECTS' },
    ])
  })
})

describe('fossilStratum', () => {
  const now = Date.parse('2026-08-26T00:00:00Z')

  it('classifies by age', () => {
    expect(fossilStratum('2026-08-24T00:00:00Z', now)).toBe('recent')
    expect(fossilStratum('2026-08-01T00:00:00Z', now)).toBe('mid')
    expect(fossilStratum('2026-01-01T00:00:00Z', now)).toBe('deep')
    expect(fossilStratum(null, now)).toBe('deep')
  })
})
