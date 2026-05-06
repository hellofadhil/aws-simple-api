import type { Hono } from 'hono'
import { healthRoutes } from './health.route'
import { homeRoutes } from './home.route'
import { taskRoutes } from './task.route'

export function registerRoutes(app: Hono) {
  app.route('/', homeRoutes)
  app.route('/', healthRoutes)
  app.route('/', taskRoutes)
}
