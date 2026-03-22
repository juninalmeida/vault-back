import { Request, Response } from 'express'
import { UserRole } from '@prisma/client'
import { prisma } from '@/database/prisma'
import { AppError } from '@/utils/app-error'
import { hash } from 'bcrypt'
import { z } from 'zod'

class UsersController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: 'Name must be at least 2 characters long' }),

      email: z
        .string()
        .trim()
        .email({ message: 'Invalid email address' })
        .toLowerCase(),

      password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long' }),

      role: z
        .enum([UserRole.employee, UserRole.manager])
        .default(UserRole.employee),
    })

    const { name, email, password, role } = bodySchema.parse(request.body)

    const userWithSameEmail = await prisma.user.findFirst({ where: { email } })

    if (userWithSameEmail) {
      throw new AppError('A user with this email already exists', 400)
    }

    const hashedPassword = await hash(password, 8)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })

    response.status(201)
  }
}

export { UsersController }
