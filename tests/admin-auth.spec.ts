import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

const mockHeaders: Record<string, string> = {}

vi.stubGlobal('getHeader', (_event: H3Event, name: string) => mockHeaders[name])
vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const e = new Error(opts.statusMessage) as Error & { statusCode: number }
  e.statusCode = opts.statusCode
  return e
})

const mockRuntimeConfig = { adminApiKey: 'test-admin-key' }
vi.stubGlobal('useRuntimeConfig', () => mockRuntimeConfig)

const { requireAdmin } = await import('../server/utils/admin-auth')

function makeEvent(headers: Record<string, string> = {}, user?: { id: string; role: string }): H3Event {
  Object.keys(mockHeaders).forEach((k) => delete mockHeaders[k])
  Object.assign(mockHeaders, headers)
  return {
    context: user ? { auth: { user } } : {},
  } as unknown as H3Event
}

describe('requireAdmin', () => {
  beforeEach(() => {
    mockRuntimeConfig.adminApiKey = 'test-admin-key'
  })

  it('allows admin user via session role', () => {
    const event = makeEvent({}, { id: 'u1', role: 'admin' })
    expect(() => requireAdmin(event)).not.toThrow()
  })

  it('allows admin via Bearer token', () => {
    const event = makeEvent({ authorization: 'Bearer test-admin-key' })
    expect(() => requireAdmin(event)).not.toThrow()
  })

  it('allows admin via x-admin-key header', () => {
    const event = makeEvent({ 'x-admin-key': 'test-admin-key' })
    expect(() => requireAdmin(event)).not.toThrow()
  })

  it('rejects non-admin user with 403', () => {
    const event = makeEvent({}, { id: 'u2', role: 'user' })
    expect(() => requireAdmin(event)).toThrow('Forbidden')
  })

  it('rejects unauthenticated request with 401', () => {
    const event = makeEvent()
    expect(() => requireAdmin(event)).toThrow('Unauthorized')
  })

  it('rejects wrong API key', () => {
    const event = makeEvent({ authorization: 'Bearer wrong-key' })
    expect(() => requireAdmin(event)).toThrow('Unauthorized')
  })

  it('rejects when adminApiKey is empty', () => {
    mockRuntimeConfig.adminApiKey = ''
    const event = makeEvent({ authorization: 'Bearer anything' })
    expect(() => requireAdmin(event)).toThrow('Unauthorized')
  })
})
