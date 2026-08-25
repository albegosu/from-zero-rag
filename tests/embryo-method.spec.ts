import { describe, it, expect } from 'vitest'
import {
  FOSSIL_KIND_COPY,
  METHOD_COPY,
  formatFossilNote,
  moveMatchesExpected,
  parseFossilNote,
  scoreStanceRun,
  stanceFor,
} from '../utils/embryo-method'

describe('stanceFor', () => {
  it('maps lifecycle to the method move', () => {
    expect(stanceFor('LATENT').move).toBe('DEFINE')
    expect(stanceFor('GERMINATING').move).toBe('PROBE')
    expect(stanceFor('GROWING').move).toBe('VARIETY')
    expect(stanceFor('MATURE').move).toBe('SIMPLEST')
  })

  it('falls back to DEFINE for unknown state', () => {
    expect(stanceFor('NOPE').move).toBe('DEFINE')
  })

  it('has copy for every lifecycle state', () => {
    for (const state of ['LATENT', 'GERMINATING', 'GROWING', 'MATURE', 'FOSSIL']) {
      expect(METHOD_COPY[state]).toBeTruthy()
    }
  })
})

describe('fossil notes', () => {
  it('round-trips kind and reason', () => {
    const encoded = formatFossilNote('WRONG_PATH', 'a checklist was the first idea')
    expect(parseFossilNote(encoded)).toEqual({
      kind: 'WRONG_PATH',
      reason: 'a checklist was the first idea',
    })
  })

  it('returns null for malformed notes', () => {
    expect(parseFossilNote('just a reason')).toBeNull()
  })

  it('has starters for every kind', () => {
    expect(FOSSIL_KIND_COPY.ILL_DEFINED.starter).toMatch(/ill-defined/)
    expect(FOSSIL_KIND_COPY.WRONG_PATH.starter).toMatch(/simpler path/)
    expect(FOSSIL_KIND_COPY.SUPERSEDED.starter).toMatch(/superseded/)
  })
})

describe('moveMatchesExpected / scoreStanceRun', () => {
  it('accepts a single expected move or a list', () => {
    expect(moveMatchesExpected('PROBE', 'PROBE')).toBe(true)
    expect(moveMatchesExpected('INVERT', ['PROBE', 'INVERT'])).toBe(true)
    expect(moveMatchesExpected('DEFINE', 'PROBE')).toBe(false)
    expect(moveMatchesExpected(undefined, 'DEFINE')).toBe(false)
  })

  it('scores a batch of offline runs', () => {
    expect(scoreStanceRun([
      { expectMove: 'DEFINE', actualMove: 'DEFINE' },
      { expectMove: ['PROBE', 'INVERT'], actualMove: 'INVERT' },
      { expectMove: 'VARIETY', actualMove: 'PROBE' },
    ])).toEqual({ hit: 2, total: 3 })
  })
})
