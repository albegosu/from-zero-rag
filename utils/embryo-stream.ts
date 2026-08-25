/** Best-effort question text from a partial JSON stream. */
export function extractPartialQuestion(buffer: string): string | null {
  const match = buffer.match(/"question"\s*:\s*"((?:\\.|[^"\\])*)/)
  if (!match) return null
  return match[1]!
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}
