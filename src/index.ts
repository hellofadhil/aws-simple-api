import { createApp } from './app'

const app = createApp()

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOST ?? '0.0.0.0'

const server = Bun.serve({
  hostname,
  port,
  fetch: app.fetch,
})

console.log(`Server is running on ${server.url}`)
