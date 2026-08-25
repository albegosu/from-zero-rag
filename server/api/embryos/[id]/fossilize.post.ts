import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

const bodySchema = z.object({
  reason: z.string().min(1, 'A reason is required to fossilize an embryo'),
})

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!
  const { reason } = await readValidatedBody(event, bodySchema.parse)

  const embryo = await prisma.embryo.findFirst({ where: { id, userId } })
  if (!embryo) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }
  if (embryo.state === 'FOSSIL') {
    throw createError({ statusCode: 409, statusMessage: 'Already a fossil' })
  }

  const fossil = await prisma.embryo.update({
    where: { id },
    data: {
      state: 'FOSSIL',
      fossilizedAt: new Date(),
      fossilReason: reason,
      fossilBy: 'USER',
      events: {
        create: {
          type: 'FOSSILIZED',
          initiatedBy: 'USER',
          payload: { reason, previousState: embryo.state },
        },
      },
    },
  })

  return fossil
})
