import { Request, Response } from 'express'
import { prisma } from '@/database/prisma'
import { AppError } from '@/utils/app-error'
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

    if (!request.user?.id) {
      throw new AppError('User not authenticated', 401)
    }

    const refund = await prisma.refund.create({
      data: {
        name,
        category,
        amount,
        filename,
        userId: request.user.id,
      },
    })

    response.status(201).json(refund)
  }

  async index(request: Request, response: Response) {
    const querySchema = z.object({
      name: z.string().optional().default(''),
      page: z.coerce.number().optional().default(1),
      perPage: z.coerce.number().optional().default(10),
    })

    const { name, page, perPage } = querySchema.parse(request.query)

    //calculo os valores de skip e take para a paginação
    const skip = (page - 1) * perPage

    const refunds = await prisma.refund.findMany({
      skip,
      take: perPage,
      where: {
        user: {
          name: {
            contains: name.trim(),
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    })

    //total de registros para calcular o total de páginas
    const totalRecords = await prisma.refund.count({
      where: {
        user: {
          name: {
            contains: name.trim(),
          },
        },
      },
    })

    const totalPages = Math.ceil(totalRecords / perPage)

    response.json({
      refunds,
      pagination: {
        page,
        perPage,
        totalRecords,
        totalPages: totalPages > 0 ? totalPages : 1, //garante que o total de páginas seja pelo menos 1
      },
    })
  }
}

export { RefundsController }
