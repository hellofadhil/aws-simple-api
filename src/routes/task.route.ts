import { Hono } from 'hono'
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../controllers/tasks.controller'

export const taskRoutes = new Hono()

taskRoutes.get('/task', listTasks)
taskRoutes.get('/tasks/:id', getTaskById)
taskRoutes.post('/tasks', createTask)
taskRoutes.put('/tasks/:id', updateTask)
taskRoutes.delete('/tasks/:id', deleteTask)
