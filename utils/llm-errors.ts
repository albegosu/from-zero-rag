import { APICallError } from 'ai'

export type LlmErrorKind =
  | 'app_rate_limit'
  | 'provider_quota'
  | 'unauthorized'
  | 'unreachable'
  | 'model'
  | 'generic'

export function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error ?? '')
}

/** App-enforced sliding window (see server/utils/rate-limit.ts). */
export function isAppRateLimitError(errorOrMessage: unknown): boolean {
  const msg = typeof errorOrMessage === 'string'
    ? errorOrMessage
    : errorMessageFromUnknown(errorOrMessage)
  return /rate limit exceeded/i.test(msg)
}

/** Provider quota / RPM (e.g. Gemini free tier, OpenAI 429 with quota text). */
export function isProviderQuotaError(errorOrMessage: unknown): boolean {
  if (isAppRateLimitError(errorOrMessage)) return false

  const msg = typeof errorOrMessage === 'string'
    ? errorOrMessage
    : errorMessageFromUnknown(errorOrMessage)
  const lower = msg.toLowerCase()

  if (lower.includes('quota exceeded') || lower.includes('resource_exhausted')) return true
  if (lower.includes('free_tier') && lower.includes('limit')) return true
  if (lower.includes('exceeded your current quota')) return true

  if (APICallError.isInstance(errorOrMessage) && errorOrMessage.statusCode === 429) {
    if (lower.includes('quota') || lower.includes('billing')) return true
    return true
  }

  if (/failed after \d+ attempts/i.test(msg) && (lower.includes('quota') || lower.includes('rate limit'))) {
    return true
  }

  return false
}

export function parseRetryAfterSeconds(message: string): number | null {
  const m = message.match(/(?:please\s+)?retry\s+in\s+([\d.]+)\s*s/i)
    ?? message.match(/retry\s+after\s+([\d.]+)/i)
  if (!m?.[1]) return null
  const n = Math.ceil(parseFloat(m[1]))
  return Number.isFinite(n) && n > 0 ? n : null
}

export interface ClassifiedLlmError {
  kind: LlmErrorKind
  statusCode: number
  retryAfterSeconds: number | null
  rawMessage: string
}

export function classifyLlmError(error: unknown): ClassifiedLlmError {
  const rawMessage = errorMessageFromUnknown(error)

  if (isAppRateLimitError(error)) {
    return { kind: 'app_rate_limit', statusCode: 429, retryAfterSeconds: null, rawMessage }
  }

  if (isProviderQuotaError(error)) {
    return {
      kind: 'provider_quota',
      statusCode: 429,
      retryAfterSeconds: parseRetryAfterSeconds(rawMessage),
      rawMessage,
    }
  }

  if (APICallError.isInstance(error)) {
    const code = error.statusCode ?? 502
    if (code === 401) {
      return { kind: 'unauthorized', statusCode: 401, retryAfterSeconds: null, rawMessage }
    }
    if (code === 429) {
      return { kind: 'provider_quota', statusCode: 429, retryAfterSeconds: parseRetryAfterSeconds(rawMessage), rawMessage }
    }
    if (code >= 500) {
      return { kind: 'model', statusCode: 502, retryAfterSeconds: null, rawMessage }
    }
    return { kind: 'model', statusCode: code, retryAfterSeconds: null, rawMessage }
  }

  const lower = rawMessage.toLowerCase()
  if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('enotfound')) {
    return { kind: 'unreachable', statusCode: 503, retryAfterSeconds: null, rawMessage }
  }

  return { kind: 'generic', statusCode: 502, retryAfterSeconds: null, rawMessage }
}

/** English fallback for server HTTP responses (client uses i18n). */
export function formatProviderQuotaMessage(retryAfterSeconds: number | null): string {
  if (retryAfterSeconds != null) {
    return `Model provider rate limit reached. Wait about ${retryAfterSeconds} seconds, then try again. Check your provider billing or usage limits, or switch model/provider in Settings.`
  }
  return 'Model provider rate limit reached. Wait a minute and try again, or check your provider billing and usage limits.'
}

export function formatAppRateLimitMessage(): string {
  return 'Rate limit exceeded. Please slow down.'
}
