import { z } from 'zod'
import { recordDuration } from '~/server/utils/metrics'

const metricSchema = z.object({
  name: z.string(),
  value: z.number(),
})

const bodySchema = z.array(metricSchema).max(10)

export default defineEventHandler(async (event) => {
  const metrics = await readValidatedBody(event, bodySchema.parse)

  for (const m of metrics) {
    recordDuration(`webvital_${m.name}_ms`, m.value)
  }

  return { ok: true }
})
