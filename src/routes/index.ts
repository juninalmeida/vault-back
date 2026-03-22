import { Router } from 'express'

import { usersRoutes } from '@/routes/users-routes'
import { refundsRoutes } from '@/routes/refunds-routes'
import { sessionsRoutes } from '@/routes/sessions-routes'
import { uploadsRoutes } from '@/routes/uploads-routes'

import { ensureAuthenticated } from '@/middlewares/ensure-authenticated'

const routes = Router()

// Rotas Públicas

routes.use('/users', usersRoutes)
routes.use('/sessions', sessionsRoutes)

// Rotas Privadas
routes.use(ensureAuthenticated)
routes.use('/refunds', refundsRoutes)
routes.use('/uploads', uploadsRoutes)

export { routes }
