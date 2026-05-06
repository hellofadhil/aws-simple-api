import type { Context } from 'hono'

export function getHome(c: Context) {
  return c.json({
    message: 'Simple API with Hono, Bun, Prisma, and PostgreSQL',
  })
}
