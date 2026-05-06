import { Hono } from 'hono'
import { registerRoutes } from './routes'

export function createApp() {
  const app = new Hono()

  registerRoutes(app)

  return app
}
