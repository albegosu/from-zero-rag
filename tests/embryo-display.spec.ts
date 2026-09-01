import { describe, it, expect } from 'vitest'
import {
  LIFECYCLE_FORWARD,
  lifecycleStepIndex,
  nextLifecycleState,
} from '../utils/embryo-display'

describe('nextLifecycleState', () => {
  it('advances forward only through living states', () => {
    expect(nextLifecycleState('LATENT')).toBe('GERMINATING')
    expect(nextLifecycleState('GERMINATING')).toBe('GROWING')
    expect(nextLifecycleState('GROWING')).toBe('MATURE')
    expect(nextLifecycleState('MATURE')).toBeNull()
    expect(nextLifecycleState('FOSSIL')).toBeNull()
  })

  it('exposes forward chain without FOSSIL', () => {
    expect(LIFECYCLE_FORWARD).toEqual(['LATENT', 'GERMINATING', 'GROWING', 'MATURE'])
  })

  it('indexes lifecycle steps including fossil', () => {
    expect(lifecycleStepIndex('LATENT')).toBe(0)
    expect(lifecycleStepIndex('FOSSIL')).toBe(4)
  })
})
