import { z } from 'zod'
import { logger } from '~/server/utils/logger'
import { incrementCounter } from '~/server/utils/metrics'

const bodySchema = z.object({
  message: z.string().max(1000),
  stack: z.string().max(4000).optional(),
  url: z.string().max(2000),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const requestId = event.context.requestId as string | undefined

  incrementCounter('client_error_total')
  logger.error('client-error', {
    requestId,
    clientUrl: body.url,
    error: body.message,
    stack: body.stack,
  })

  return { ok: true }
})
