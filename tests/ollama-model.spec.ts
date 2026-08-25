import { describe, expect, it } from 'vitest'
import { sanitizeModelId } from '../utils/llm-model'

describe('sanitizeModelId', () => {
  it('accepts ollama-style names', () => {
    expect(sanitizeModelId('llama3.2')).toBe('llama3.2')
    expect(sanitizeModelId('kimi-k2.7-code:cloud')).toBe('kimi-k2.7-code:cloud')
  })

  it('rejects empty, spaced, or oversized values', () => {
    expect(sanitizeModelId('')).toBeUndefined()
    expect(sanitizeModelId('llama 3')).toBeUndefined()
    expect(sanitizeModelId('a'.repeat(97))).toBeUndefined()
    expect(sanitizeModelId('../etc/passwd')).toBeUndefined()
  })
})
