import type { Context } from 'hono'
import { prisma } from '../lib/prisma'

export async function getHealth(c: Context) {
  await prisma.$queryRaw`SELECT 1`

  return c.json({
    status: 'ok',
  })
}
