import { Hono } from 'hono'
import { prisma } from './lib/prisma'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    message: 'Simple API with Hono, Bun, Prisma, and PostgreSQL',
  })
})

app.get('/healths', async (c) => {
  await prisma.$queryRaw`SELECT 1`

  return c.json({
    status: 'ok',
  })
})

app.get('/tasks', async (c) => {
  const tasks = await prisma.task.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return c.json(tasks)
})

app.get('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.json({ message: 'Invalid task id' }, 400)
  }

  const task = await prisma.task.findUnique({
    where: { id },
  })

  if (!task) {
    return c.json({ message: 'Task not found' }, 404)
  }

  return c.json(task)
})

app.post('/tasks', async (c) => {
  const body = await c.req.json<{
    title?: string
    done?: boolean
  }>()

  if (!body.title || body.title.trim().length === 0) {
    return c.json({ message: 'Title is required' }, 400)
  }

  const task = await prisma.task.create({
    data: {
      title: body.title.trim(),
      done: body.done ?? false,
    },
  })

  return c.json(task, 201)
})

app.put('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.json({ message: 'Invalid task id' }, 400)
  }

  const body = await c.req.json<{
    title?: string
    done?: boolean
  }>()

  const existingTask = await prisma.task.findUnique({
    where: { id },
  })

  if (!existingTask) {
    return c.json({ message: 'Task not found' }, 404)
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title?.trim() ?? existingTask.title,
      done: body.done ?? existingTask.done,
    },
  })

  return c.json(task)
})

app.delete('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.json({ message: 'Invalid task id' }, 400)
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
  })

  if (!existingTask) {
    return c.json({ message: 'Task not found' }, 404)
  }

  await prisma.task.delete({
    where: { id },
  })

  return c.json({ message: 'Task deleted' })
})

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOST ?? '0.0.0.0'

const server = Bun.serve({
  hostname,
  port,
  fetch: app.fetch,
})

console.log(`Server is running on ${server.url}`)
