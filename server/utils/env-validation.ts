import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(16).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  OLLAMA_URL: z.string().optional(),
})

/** Validates required environment variables. Throws on failure. */
export function validateEnv(): void {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`[env] Invalid environment: ${parsed.error.message}`)
  }

  const env = parsed.data
  const isProd = env.NODE_ENV === 'production'

  if (!env.DATABASE_URL?.trim()) {
    throw new Error('[env] DATABASE_URL is required')
  }

  const authSecret = env.BETTER_AUTH_SECRET?.trim() || env.AUTH_SECRET?.trim()
  if (!authSecret) {
    throw new Error('[env] BETTER_AUTH_SECRET or AUTH_SECRET is required (min 16 chars)')
  }

  if (!env.OLLAMA_URL?.trim()) {
    throw new Error('[env] OLLAMA_URL is required (local http://localhost:11434 or Ollama Cloud)')
  }

  if (isProd && authSecret.length < 32) {
    console.warn('[env] Production auth secret should be at least 32 characters (openssl rand -hex 32)')
  }
}
