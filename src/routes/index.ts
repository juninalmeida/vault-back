import { Router } from 'express'

import { usersRoutes } from '@/routes/users-routes'

const routes = Router()

// Rotas Públicas

routes.use('/users', usersRoutes)

export { routes }
