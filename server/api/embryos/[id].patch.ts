import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { parseFossilNote } from '~/utils/embryo-method'
import { parseConnectionNote } from '~/utils/embryo-display'

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
    action: z.literal('accept_connection'),
    noteId: z.string(),
  }),
  z.object({
    action: z.literal('dismiss_note'),
    noteId: z.string(),
  }),
  z.object({
    action: z.literal('reply'),
    noteId: z.string(),
    reply: z.string().min(1).max(10000),
  }),
  z.object({
    action: z.literal('accept_path'),
    noteId: z.string(),
  }),
  z.object({
    action: z.literal('accept_fossil'),
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
    }).catch((err: { code?: string }) => {
      if (err?.code === 'P2002') {
        throw createError({ statusCode: 409, statusMessage: 'Connection already exists' })
      }
      throw err
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

  if (body.action === 'accept_connection') {
    const note = await prisma.agentNote.findFirst({
      where: { id: body.noteId, embryoId: id, type: 'PENDING_CONNECTION', dismissed: false },
    })
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Pending connection not found' })
    }
    const parsed = parseConnectionNote(note.content)
    if (!parsed) {
      throw createError({ statusCode: 400, statusMessage: 'Malformed connection note' })
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.connection.findUnique({
        where: { sourceId_targetId: { sourceId: id, targetId: parsed.targetId } },
      })
      const type = CONNECTION_TYPES.includes(parsed.type as typeof CONNECTION_TYPES[number])
        ? parsed.type as typeof CONNECTION_TYPES[number]
        : 'EXTENDS'
      const connection = existing
        ? await tx.connection.update({
            where: { id: existing.id },
            data: { confirmedByUser: true, note: parsed.reason },
            include: { target: { select: { id: true, seed: true, state: true } } },
          })
        : await tx.connection.create({
            data: {
              sourceId: id,
              targetId: parsed.targetId,
              type,
              detectedBy: 'AGENT',
              confirmedByUser: true,
              note: parsed.reason,
            },
            include: { target: { select: { id: true, seed: true, state: true } } },
          })
      await tx.embryoEvent.create({
        data: {
          embryoId: id,
          type: 'CONNECTION_MADE',
          initiatedBy: 'USER',
          payload: { connectionId: connection.id, targetId: parsed.targetId, type: connection.type, fromProposal: true },
        },
      })
      await tx.agentNote.update({
        where: { id: note.id },
        data: { dismissed: true },
      })
      return connection
    })
  }

  if (body.action === 'dismiss_note') {
    const note = await prisma.agentNote.findFirst({
      where: { id: body.noteId, embryoId: id },
    })
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Agent note not found' })
    }
    if (note.type === 'PENDING_QUESTION') {
      await prisma.embryoEvent.create({
        data: {
          embryoId: id,
          type: 'USER_RESPONSE',
          initiatedBy: 'USER',
          payload: { noteId: note.id, question: note.content, skipped: true },
        },
      })
    }
    if (note.type === 'PENDING_CONNECTION') {
      const parsed = parseConnectionNote(note.content)
      if (parsed) {
        await prisma.connection.deleteMany({
          where: {
            sourceId: id,
            targetId: parsed.targetId,
            detectedBy: 'AGENT',
            confirmedByUser: false,
          },
        })
      }
    }
    return prisma.agentNote.update({
      where: { id: body.noteId },
      data: { dismissed: true },
    })
  }

  if (body.action === 'reply') {
    const note = await prisma.agentNote.findFirst({
      where: { id: body.noteId, embryoId: id, type: 'PENDING_QUESTION', dismissed: false },
    })
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Pending question not found' })
    }

    const existingTension = await prisma.tension.findFirst({
      where: { embryoId: id, question: note.content, resolved: false },
    })

    return prisma.$transaction(async (tx) => {
      const tension = existingTension ?? await tx.tension.create({
        data: {
          embryoId: id,
          question: note.content,
          raisedBy: 'AGENT',
        },
      })

      if (!existingTension) {
        await tx.embryoEvent.create({
          data: {
            embryoId: id,
            type: 'TENSION_ADDED',
            initiatedBy: 'AGENT',
            payload: { tensionId: tension.id, fromReply: true },
          },
        })
      }

      const event = await tx.embryoEvent.create({
        data: {
          embryoId: id,
          type: 'USER_RESPONSE',
          initiatedBy: 'USER',
          payload: {
            noteId: note.id,
            question: note.content,
            reply: body.reply,
            tensionId: tension.id,
          },
        },
      })

      await tx.agentNote.update({
        where: { id: note.id },
        data: { dismissed: true },
      })

      return { event, tension, noteId: note.id }
    })
  }

  if (body.action === 'accept_path') {
    const note = await prisma.agentNote.findFirst({
      where: { id: body.noteId, embryoId: id, type: 'PENDING_PATH', dismissed: false },
    })
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Pending path not found' })
    }
    const question = note.content.trim()
    if (!question) {
      throw createError({ statusCode: 400, statusMessage: 'Path is empty' })
    }

    return prisma.$transaction(async (tx) => {
      const tension = await tx.tension.create({
        data: {
          embryoId: id,
          question,
          raisedBy: 'AGENT',
        },
      })
      await tx.embryoEvent.create({
        data: {
          embryoId: id,
          type: 'TENSION_ADDED',
          initiatedBy: 'USER',
          payload: { tensionId: tension.id, fromPath: true, noteId: note.id },
        },
      })
      await tx.agentNote.update({
        where: { id: note.id },
        data: { dismissed: true },
      })
      return tension
    })
  }

  if (body.action === 'accept_fossil') {
    const note = await prisma.agentNote.findFirst({
      where: { id: body.noteId, embryoId: id, type: 'PENDING_FOSSIL', dismissed: false },
    })
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Pending fossil not found' })
    }
    const parsed = parseFossilNote(note.content)
    const reason = parsed?.reason || note.content.trim()
    if (!reason) {
      throw createError({ statusCode: 400, statusMessage: 'Fossil reason is empty' })
    }

    return prisma.$transaction(async (tx) => {
      const fossil = await tx.embryo.update({
        where: { id },
        data: {
          state: 'FOSSIL',
          fossilizedAt: new Date(),
          fossilReason: reason,
          fossilBy: 'AGENT',
          events: {
            create: {
              type: 'FOSSILIZED',
              initiatedBy: 'USER',
              payload: {
                reason,
                kind: parsed?.kind,
                previousState: embryo.state,
                fromProposal: true,
                noteId: note.id,
              },
            },
          },
        },
      })
      await tx.agentNote.update({
        where: { id: note.id },
        data: { dismissed: true },
      })
      return fossil
    })
  }
})
