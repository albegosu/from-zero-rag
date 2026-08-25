export function sanitizeModelId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!/^[a-zA-Z0-9._:-]{1,96}$/.test(trimmed)) return undefined
  return trimmed
}
