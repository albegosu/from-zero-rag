import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let markProviderQuotaHit: typeof import('../server/utils/llm-quota-guard').markProviderQuotaHit
let shouldSuppressOptionalLlmCalls: typeof import('../server/utils/llm-quota-guard').shouldSuppressOptionalLlmCalls

describe('llm quota guard', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    ;({ markProviderQuotaHit, shouldSuppressOptionalLlmCalls } = await import('../server/utils/llm-quota-guard'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('suppresses optional LLM calls after a provider quota error', () => {
    markProviderQuotaHit('RESOURCE_EXHAUSTED: quota exceeded')

    expect(shouldSuppressOptionalLlmCalls()).toBe(true)
  })

  it('does not suppress optional LLM calls for app rate limit errors', () => {
    markProviderQuotaHit(
      'Rate limit exceeded. Max 30 requests per minute. Add your own API key in Settings to remove this limit.',
    )

    expect(shouldSuppressOptionalLlmCalls()).toBe(false)
  })

  it('can mark suppression explicitly when no error is provided', () => {
    markProviderQuotaHit()

    expect(shouldSuppressOptionalLlmCalls()).toBe(true)
  })

  it('stops suppressing after the five-minute cooldown expires', () => {
    markProviderQuotaHit('quota exceeded')

    vi.advanceTimersByTime(5 * 60_000 - 1)
    expect(shouldSuppressOptionalLlmCalls()).toBe(true)

    vi.advanceTimersByTime(1)
    expect(shouldSuppressOptionalLlmCalls()).toBe(false)
  })
})
