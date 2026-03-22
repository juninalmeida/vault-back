import { Router } from 'express'

import { usersRoutes } from '@/routes/users-routes'
import { refundsRoutes } from '@/routes/refunds-routes'
import { sessionsRoutes } from '@/routes/sessions-routes'

const routes = Router()

// Rotas Públicas

routes.use('/users', usersRoutes)
routes.use('/sessions', sessionsRoutes)

// Rotas Privadas
routes.use('/refunds', require('./refunds-routes').refundsRoutes)

export { routes }
