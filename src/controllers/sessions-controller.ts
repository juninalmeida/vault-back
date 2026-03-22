import { Request, Response } from 'express'
import { prisma } from '@/database/prisma'
import { AppError } from '@/utils/app-error'
import { compare } from 'bcrypt'
import { z } from 'zod'

class SessionsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      email: z.string().email({ message: 'Invalid email address' }),
      password: z.string(),
    })

    const { email, password } = bodySchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    const passwordMatches = await compare(password, user.password)

    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401)
    }

    response.json({ email, password })
  }
}

export { SessionsController }
