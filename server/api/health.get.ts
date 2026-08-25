import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  let db = false
  try {
    await prisma.$queryRaw`SELECT 1`
    db = true
  }
  catch {
    db = false
  }

  return {
    status: db ? 'ok' : 'degraded',
    checks: { db },
    ts: new Date().toISOString(),
  }
})
