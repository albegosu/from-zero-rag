import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateEnv } from '../server/utils/env-validation'

describe('validateEnv', () => {
  const snapshot = { ...process.env }

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-validation-min-32'
    process.env.OLLAMA_URL = 'http://localhost:11434'
    delete process.env.AUTH_SECRET
  })

  afterEach(() => {
    process.env = { ...snapshot }
  })

  it('passes with database, auth secret, and Ollama URL', () => {
    expect(() => validateEnv()).not.toThrow()
  })

  it('fails without DATABASE_URL', () => {
    delete process.env.DATABASE_URL
    expect(() => validateEnv()).toThrow(/DATABASE_URL/)
  })

  it('fails without auth secret', () => {
    delete process.env.BETTER_AUTH_SECRET
    delete process.env.AUTH_SECRET
    expect(() => validateEnv()).toThrow(/BETTER_AUTH_SECRET/)
  })

  it('fails without OLLAMA_URL', () => {
    delete process.env.OLLAMA_URL
    expect(() => validateEnv()).toThrow(/OLLAMA_URL/)
  })
})
