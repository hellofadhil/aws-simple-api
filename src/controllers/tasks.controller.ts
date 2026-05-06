import type { Context } from 'hono'
import { prisma } from '../lib/prisma'

type TaskPayload = {
  title?: string
  done?: boolean
}

function parseTaskId(c: Context) {
  const id = Number(c.req.param('id'))

  if (Number.isNaN(id)) {
    return null
  }

  return id
}

export async function listTasks(c: Context) {
  const tasks = await prisma.task.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return c.json(tasks)
}

export async function getTaskById(c: Context) {
  const id = parseTaskId(c)

  if (id === null) {
    return c.json({ message: 'Invalid task id' }, 400)
  }

  const task = await prisma.task.findUnique({
    where: { id },
  })

  if (!task) {
    return c.json({ message: 'Task not found' }, 404)
  }

  return c.json(task)
}

export async function createTask(c: Context) {
  const body = await c.req.json<TaskPayload>()

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
}

export async function updateTask(c: Context) {
  const id = parseTaskId(c)

  if (id === null) {
    return c.json({ message: 'Invalid task id' }, 400)
  }

  const body = await c.req.json<TaskPayload>()

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
}

export async function deleteTask(c: Context) {
  const id = parseTaskId(c)

  if (id === null) {
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
}
