import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)

  const query = getQuery(event)
  const state = query.state as string | undefined

  const embryos = await prisma.embryo.findMany({
    where: {
      userId,
      ...(state ? { state: state as any } : {}),
    },
    include: {
      tensions: { where: { resolved: false } },
      agentNotes: { where: { dismissed: false } },
      _count: { select: { events: true, connections: true, connectedTo: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return embryos
})
