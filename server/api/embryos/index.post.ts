import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

const bodySchema = z.object({
  seed: z.string().min(1).max(10000),
})

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const { seed } = await readValidatedBody(event, bodySchema.parse)

  const embryo = await prisma.embryo.create({
    data: {
      userId,
      seed,
      events: {
        create: {
          type: 'CREATED',
          initiatedBy: 'USER',
        },
      },
    },
    include: {
      events: true,
      tensions: true,
      agentNotes: true,
    },
  })

  return embryo
})
