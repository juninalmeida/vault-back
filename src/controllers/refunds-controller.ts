import { Request, Response } from 'express'
import { z } from 'zod'

const CategoriesEnum = z.enum([
  'food',
  'others',
  'services',
  'transport',
  'accommodation',
])

class RefundsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(1, { message: 'Name is required' }),
      category: CategoriesEnum,
      amount: z
        .number()
        .positive({ message: 'amount must be a positive number' }),
      filename: z.string().min(20),
    })

    const { name, category, amount, filename } = bodySchema.parse(request.body)

    response.json({ message: 'Refund created successfully' })
  }
}

export { RefundsController }
