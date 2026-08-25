import { describe, it, expect } from 'vitest'
import { APICallError } from 'ai'
import {
  classifyLlmError,
  isAppRateLimitError,
  isProviderQuotaError,
  parseRetryAfterSeconds,
} from '../utils/llm-errors'

const GEMINI_QUOTA_MSG =
  'Failed after 3 attempts. Last error: You exceeded your current quota, please check your plan and billing details. ' +
  'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash ' +
  'Please retry in 41.513295736s.'

describe('isProviderQuotaError', () => {
  it('detects Gemini free-tier quota messages', () => {
    expect(isProviderQuotaError(new Error(GEMINI_QUOTA_MSG))).toBe(true)
  })

  it('detects RESOURCE_EXHAUSTED', () => {
    expect(isProviderQuotaError('RESOURCE_EXHAUSTED: quota exceeded')).toBe(true)
  })

  it('does not treat app rate limit as provider quota', () => {
    expect(
      isProviderQuotaError('Rate limit exceeded. Max 30 requests per minute. Add your own API key in Settings to remove this limit.'),
    ).toBe(false)
  })
})

describe('isAppRateLimitError', () => {
  it('detects app-enforced limit message', () => {
    expect(isAppRateLimitError('Rate limit exceeded. Please slow down.')).toBe(true)
    expect(
      isAppRateLimitError('Rate limit exceeded. Max 30 requests per minute. Add your own API key in Settings to remove this limit.'),
    ).toBe(true)
  })
})

describe('parseRetryAfterSeconds', () => {
  it('parses Google retry hint', () => {
    expect(parseRetryAfterSeconds(GEMINI_QUOTA_MSG)).toBe(42)
  })

  it('returns null when absent', () => {
    expect(parseRetryAfterSeconds('generic error')).toBeNull()
  })
})

describe('classifyLlmError', () => {
  it('classifies Gemini quota as provider_quota with retry seconds', () => {
    const c = classifyLlmError(new Error(GEMINI_QUOTA_MSG))
    expect(c.kind).toBe('provider_quota')
    expect(c.statusCode).toBe(429)
    expect(c.retryAfterSeconds).toBe(42)
  })

  it('classifies app rate limit separately', () => {
    const c = classifyLlmError(
      new Error('Rate limit exceeded. Please slow down.'),
    )
    expect(c.kind).toBe('app_rate_limit')
  })

  it('classifies APICallError 401', () => {
    const err = new APICallError({
      message: 'Unauthorized',
      url: 'https://example.com',
      requestBodyValues: {},
      statusCode: 401,
      responseHeaders: {},
      responseBody: '',
      isRetryable: false,
    })
    expect(classifyLlmError(err).kind).toBe('unauthorized')
  })
})
