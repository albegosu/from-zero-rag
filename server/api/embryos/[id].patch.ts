import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

const VALID_STATES = ['LATENT', 'GERMINATING', 'GROWING', 'MATURE'] as const

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('transition'),
    state: z.enum(VALID_STATES),
  }),
  z.object({
    action: z.literal('add_tension'),
    question: z.string().min(1),
  }),
  z.object({
    action: z.literal('resolve_tension'),
    tensionId: z.string(),
  }),
])

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)

  const embryo = await prisma.embryo.findFirst({ where: { id, userId } })
  if (!embryo) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }
  if (embryo.state === 'FOSSIL') {
    throw createError({ statusCode: 409, statusMessage: 'Fossils cannot be modified' })
  }

  if (body.action === 'transition') {
    const updated = await prisma.embryo.update({
      where: { id },
      data: {
        state: body.state,
        events: {
          create: {
            type: 'STATE_CHANGED',
            initiatedBy: 'USER',
            payload: { from: embryo.state, to: body.state },
          },
        },
      },
    })
    return updated
  }

  if (body.action === 'add_tension') {
    const tension = await prisma.tension.create({
      data: {
        embryoId: id,
        question: body.question,
        raisedBy: 'USER',
      },
    })
    await prisma.embryoEvent.create({
      data: {
        embryoId: id,
        type: 'TENSION_ADDED',
        initiatedBy: 'USER',
        payload: { tensionId: tension.id },
      },
    })
    return tension
  }

  if (body.action === 'resolve_tension') {
    const tension = await prisma.tension.findFirst({
      where: { id: body.tensionId, embryoId: id },
    })
    if (!tension) {
      throw createError({ statusCode: 404, statusMessage: 'Tension not found' })
    }
    const updated = await prisma.tension.update({
      where: { id: body.tensionId },
      data: { resolved: true, resolvedAt: new Date() },
    })
    await prisma.embryoEvent.create({
      data: {
        embryoId: id,
        type: 'TENSION_RESOLVED',
        initiatedBy: 'USER',
        payload: { tensionId: tension.id },
      },
    })
    return updated
  }
})
