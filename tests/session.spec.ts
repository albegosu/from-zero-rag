import { describe, it, expect, vi } from 'vitest'

vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const e = new Error(opts.statusMessage) as Error & { statusCode: number }
  e.statusCode = opts.statusCode
  return e
})

import { requireSessionUserId } from '../server/utils/session'
import type { H3Event } from 'h3'

describe('requireSessionUserId', () => {
  it('returns user ID when session exists', () => {
    const event = {
      context: { auth: { user: { id: 'usr_123' } } },
    } as unknown as H3Event
    expect(requireSessionUserId(event)).toBe('usr_123')
  })

  it('throws 401 when no auth context', () => {
    const event = { context: {} } as unknown as H3Event
    expect(() => requireSessionUserId(event)).toThrow('Unauthorized')
  })

  it('throws 401 when user has no ID', () => {
    const event = {
      context: { auth: { user: { id: undefined } } },
    } as unknown as H3Event
    expect(() => requireSessionUserId(event)).toThrow('Unauthorized')
  })
})
