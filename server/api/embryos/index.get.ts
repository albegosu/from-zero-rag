import { prisma } from '~/server/utils/prisma'
import { requireSessionUserId } from '~/server/utils/session'
import { EMBRYO_LIST_INCLUDE, parseEmbryoStateParam } from '~/utils/embryo-lab'

export default defineEventHandler(async (event) => {
  const userId = requireSessionUserId(event)

  const query = getQuery(event)
  let state: ReturnType<typeof parseEmbryoStateParam>
  try {
    state = parseEmbryoStateParam(query.state)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid embryo state' })
  }

  return prisma.embryo.findMany({
    where: {
      userId,
      ...(state ? { state } : {}),
    },
    include: EMBRYO_LIST_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  })
})
