import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

const VALID_STATES = ['LATENT', 'GERMINATING', 'GROWING', 'MATURE'] as const

const CONNECTION_TYPES = ['REINFORCES', 'CONTRADICTS', 'EXTENDS', 'RESURRECTS'] as const

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
  z.object({
    action: z.literal('connect'),
    targetId: z.string(),
    type: z.enum(CONNECTION_TYPES),
    note: z.string().optional(),
  }),
  z.object({
    action: z.literal('confirm_connection'),
    connectionId: z.string(),
  }),
  z.object({
    action: z.literal('dismiss_note'),
    noteId: z.string(),
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

  if (body.action === 'connect') {
    const target = await prisma.embryo.findFirst({ where: { id: body.targetId, userId } })
    if (!target) {
      throw createError({ statusCode: 404, statusMessage: 'Target embryo not found' })
    }
    if (body.targetId === id) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot connect embryo to itself' })
    }
    const connection = await prisma.connection.create({
      data: {
        sourceId: id,
        targetId: body.targetId,
        type: body.type,
        detectedBy: 'USER',
        confirmedByUser: true,
        note: body.note || null,
      },
      include: { target: { select: { id: true, seed: true, state: true } } },
    })
    await prisma.embryoEvent.create({
      data: {
        embryoId: id,
        type: 'CONNECTION_MADE',
        initiatedBy: 'USER',
        payload: { connectionId: connection.id, targetId: body.targetId, type: body.type },
      },
    })
    return connection
  }

  if (body.action === 'confirm_connection') {
    const connection = await prisma.connection.findFirst({
      where: { id: body.connectionId, sourceId: id },
    })
    if (!connection) {
      throw createError({ statusCode: 404, statusMessage: 'Connection not found' })
    }
    return prisma.connection.update({
      where: { id: body.connectionId },
      data: { confirmedByUser: true },
      include: { target: { select: { id: true, seed: true, state: true } } },
    })
  }

  if (body.action === 'dismiss_note') {
    const note = await prisma.agentNote.findFirst({
      where: { id: body.noteId, embryoId: id },
    })
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Agent note not found' })
    }
    return prisma.agentNote.update({
      where: { id: body.noteId },
      data: { dismissed: true },
    })
  }
})
