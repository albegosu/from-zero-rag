import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { EMBRYO_LIST_INCLUDE } from '~/utils/embryo-lab'

const bodySchema = z.object({
  seed: z.string().min(1).max(10000).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!

  let seedOverride: string | undefined
  try {
    const raw = await readBody(event)
    seedOverride = bodySchema.parse(raw ?? {}).seed
  }
  catch {
    seedOverride = undefined
  }

  const fossil = await prisma.embryo.findFirst({ where: { id, userId } })
  if (!fossil) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }
  if (fossil.state !== 'FOSSIL') {
    throw createError({ statusCode: 409, statusMessage: 'Only fossils can be resurrected' })
  }

  const seed = seedOverride?.trim() || fossil.seed

  const created = await prisma.$transaction(async (tx) => {
    const embryo = await tx.embryo.create({
      data: {
        userId,
        seed,
        events: {
          create: {
            type: 'CREATED',
            initiatedBy: 'USER',
            payload: { resurrectedFrom: fossil.id },
          },
        },
      },
    })
    await tx.connection.create({
      data: {
        sourceId: embryo.id,
        targetId: fossil.id,
        type: 'RESURRECTS',
        detectedBy: 'USER',
        confirmedByUser: true,
        note: 'resurrected from fossil',
      },
    })
    await tx.embryoEvent.create({
      data: {
        embryoId: embryo.id,
        type: 'CONNECTION_MADE',
        initiatedBy: 'USER',
        payload: { targetId: fossil.id, type: 'RESURRECTS', resurrectedFrom: fossil.id },
      },
    })
    return tx.embryo.findUniqueOrThrow({
      where: { id: embryo.id },
      include: EMBRYO_LIST_INCLUDE,
    })
  })

  return created
})
