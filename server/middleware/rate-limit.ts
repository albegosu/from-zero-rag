/**
 * Token-bucket rate limiter, in-memory. Per (ip + userId) key.
 * Sufficient for single-instance MVP. For multi-instance, replace with Redis.
 */
import type { H3Event } from 'h3'

interface Bucket {
  tokens: number
  lastRefill: number
}

interface Rule {
  test: (path: string, method: string) => boolean
  capacity: number
  refillPerSec: number
  label: string
}

const RULES: Rule[] = [
  {
    label: 'chat',
    test: (p, m) =>
      m === 'POST' && (p.startsWith('/api/chat') || /\/api\/embryos\/[^/]+\/agent$/.test(p)),
    capacity: 30,
    refillPerSec: 30 / 60, // 30 req/min
  },
  {
    label: 'upload',
    test: (p, m) => m === 'POST' && p.startsWith('/api/documents/upload'),
    capacity: 10,
    refillPerSec: 10 / 60, // 10 req/min
  },
  {
    label: 'documents-write',
    test: (p, m) => (m === 'POST' || m === 'DELETE') && p.startsWith('/api/documents'),
    capacity: 30,
    refillPerSec: 30 / 60,
  },
]

const buckets = new Map<string, Bucket>()

function clientKey(event: H3Event): string {
  const xff = getHeader(event, 'x-forwarded-for') ?? ''
  const ip = xff.split(',')[0].trim() || event.node.req.socket?.remoteAddress || 'unknown'
  const userId = event.context.auth?.user?.id ?? 'anon'
  return `${ip}|${userId}`
}

function take(rule: Rule, key: string): boolean {
  const now = Date.now()
  const k = `${rule.label}|${key}`
  const b = buckets.get(k) ?? { tokens: rule.capacity, lastRefill: now }
  const elapsedSec = (now - b.lastRefill) / 1000
  const refill = elapsedSec * rule.refillPerSec
  b.tokens = Math.min(rule.capacity, b.tokens + refill)
  b.lastRefill = now
  if (b.tokens < 1) {
    buckets.set(k, b)
    return false
  }
  b.tokens -= 1
  buckets.set(k, b)
  return true
}

export default defineEventHandler((event) => {
  const path = event.path ?? ''
  const method = event.method ?? 'GET'
  if (!path.startsWith('/api/')) return

  const matched = RULES.find((r) => r.test(path, method))
  if (!matched) return

  const ok = take(matched, clientKey(event))
  if (!ok) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Rate limit exceeded. Please slow down.',
    })
  }
})
