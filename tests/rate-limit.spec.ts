import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

const getHeaderMock = vi.fn(() => undefined)
vi.stubGlobal('getHeader', getHeaderMock)
vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const e = new Error(opts.statusMessage) as Error & { statusCode: number }
  e.statusCode = opts.statusCode
  return e
})
vi.stubGlobal('defineEventHandler', (handler: (event: H3Event) => void) => handler)

const handler = (await import('../server/middleware/rate-limit')).default as (event: H3Event) => void

function makeEvent(path: string, method = 'POST', ip = '127.0.0.1', userId?: string): H3Event {
  return {
    path,
    method,
    context: { auth: userId ? { user: { id: userId } } : undefined },
    node: { req: { socket: { remoteAddress: ip } } },
  } as unknown as H3Event
}

describe('rate-limit middleware', () => {
  beforeEach(() => {
    getHeaderMock.mockReturnValue(undefined)
  })

  it('allows requests under the limit', () => {
    const event = makeEvent('/api/chat', 'POST', '10.0.0.1', 'user-1')
    expect(() => handler(event)).not.toThrow()
  })

  it('skips non-API paths', () => {
    const event = makeEvent('/auth/signin', 'GET')
    expect(() => handler(event)).not.toThrow()
  })

  it('skips GET requests (no matching rule)', () => {
    const event = makeEvent('/api/chat', 'GET')
    expect(() => handler(event)).not.toThrow()
  })

  it('throws 429 after exhausting chat capacity (30 req)', () => {
    const ip = '10.0.0.99'
    for (let i = 0; i < 30; i++) {
      handler(makeEvent('/api/chat', 'POST', ip, 'flood-user'))
    }
    expect(() => handler(makeEvent('/api/chat', 'POST', ip, 'flood-user'))).toThrow('Rate limit exceeded')
  })

  it('applies upload rule with lower capacity (10 req)', () => {
    const ip = '10.0.0.50'
    for (let i = 0; i < 10; i++) {
      handler(makeEvent('/api/documents/upload', 'POST', ip, 'upload-user'))
    }
    expect(() => handler(makeEvent('/api/documents/upload', 'POST', ip, 'upload-user'))).toThrow('Rate limit exceeded')
  })

  it('isolates rate limits per client key', () => {
    for (let i = 0; i < 30; i++) {
      handler(makeEvent('/api/chat', 'POST', '10.0.0.70', 'user-a'))
    }
    expect(() => handler(makeEvent('/api/chat', 'POST', '10.0.0.71', 'user-b'))).not.toThrow()
  })
})
