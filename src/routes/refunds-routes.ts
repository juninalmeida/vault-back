import { Router } from 'express'

import { RefundsController } from '@/controllers/refunds-controller'

const refundsRoutes = Router()

const refundsController = new RefundsController()

refundsRoutes.post('/', refundsController.create)

export { refundsRoutes }
