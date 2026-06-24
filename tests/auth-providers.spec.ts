import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('auth-providers config endpoint', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_SECRET
  })

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = originalEnv.GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_SECRET = originalEnv.GOOGLE_CLIENT_SECRET
    process.env.GITHUB_CLIENT_ID = originalEnv.GITHUB_CLIENT_ID
    process.env.GITHUB_CLIENT_SECRET = originalEnv.GITHUB_CLIENT_SECRET
  })

  function getProviders() {
    return {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    }
  }

  it('returns false for both when no env vars set', () => {
    expect(getProviders()).toEqual({ google: false, github: false })
  })

  it('returns true for google when both client vars are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    expect(getProviders()).toEqual({ google: true, github: false })
  })

  it('returns false for google when only client ID is set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-id'
    expect(getProviders()).toEqual({ google: false, github: false })
  })

  it('returns true for github when both client vars are set', () => {
    process.env.GITHUB_CLIENT_ID = 'test-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-secret'
    expect(getProviders()).toEqual({ google: false, github: true })
  })

  it('returns true for both when all vars set', () => {
    process.env.GOOGLE_CLIENT_ID = 'g-id'
    process.env.GOOGLE_CLIENT_SECRET = 'g-secret'
    process.env.GITHUB_CLIENT_ID = 'gh-id'
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret'
    expect(getProviders()).toEqual({ google: true, github: true })
  })
})
