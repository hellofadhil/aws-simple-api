import { Hono } from 'hono'
import { getHome } from '../controllers/home.controller'

export const homeRoutes = new Hono()

homeRoutes.get('/', getHome)
