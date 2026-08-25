import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)
  const id = getRouterParam(event, 'id')!

  const embryo = await prisma.embryo.findFirst({
    where: { id, userId },
    include: {
      events: { orderBy: { createdAt: 'asc' } },
      tensions: { orderBy: { createdAt: 'asc' } },
      agentNotes: { where: { dismissed: false }, orderBy: { createdAt: 'desc' } },
      connections: {
        include: { target: { select: { id: true, seed: true, state: true } } },
      },
      connectedTo: {
        include: { source: { select: { id: true, seed: true, state: true } } },
      },
    },
  })

  if (!embryo) {
    throw createError({ statusCode: 404, statusMessage: 'Embryo not found' })
  }

  return embryo
})
