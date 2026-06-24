import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  encryptSecret,
  decryptSecret,
  safeCompareStrings,
  getAuthSecret,
  GLOBAL_SECRET_SETTING_KEYS,
} from '../server/utils/settings.service'

describe('settings.service crypto', () => {
  const prevSecret = process.env.BETTER_AUTH_SECRET

  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-unit-tests-min-32-chars'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.BETTER_AUTH_SECRET
    else process.env.BETTER_AUTH_SECRET = prevSecret
  })

  it('round-trips encrypt/decrypt', () => {
    const plain = 'sk-test-api-key-12345'
    const cipher = encryptSecret(plain)
    expect(cipher).not.toBe(plain)
    expect(decryptSecret(cipher)).toBe(plain)
  })

  it('decryptSecret returns null for corrupted data', () => {
    expect(decryptSecret('not-valid-base64-ciphertext!!')).toBeNull()
  })

  it('getAuthSecret returns configured secret', () => {
    expect(getAuthSecret()).toBe('test-secret-for-unit-tests-min-32-chars')
  })

  it('safeCompareStrings matches equal strings', () => {
    expect(safeCompareStrings('abc', 'abc')).toBe(true)
    expect(safeCompareStrings('abc', 'abd')).toBe(false)
    expect(safeCompareStrings('ab', 'abc')).toBe(false)
  })

  it('marks expected keys as global secrets', () => {
    expect(GLOBAL_SECRET_SETTING_KEYS.has('GOOGLE_API_KEY')).toBe(true)
    expect(GLOBAL_SECRET_SETTING_KEYS.has('wizard.state')).toBe(true)
    expect(GLOBAL_SECRET_SETTING_KEYS.has('DATABASE_URL')).toBe(true)
  })
})
