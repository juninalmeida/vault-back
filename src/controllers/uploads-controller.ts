import { Request, Response } from 'express'
import z from 'zod'

import uploadConfig from '@/configs/upload'

class UploadsController {
  async create(request: Request, response: Response) {
    try {
      const fileSchema = z
        .object({
          filename: z.string().min(1, 'Filename is required'),
          mimetype: z.string().refine(
            (type) => uploadConfig.ACCEPTED_IMAGE_TYPES.includes(type),
            `Invalid file format. Allowed formats:
              ${uploadConfig.ACCEPTED_IMAGE_TYPES}`,
          ),
          size: z
            .number()
            .positive()
            .refine(
              (size) => size <= uploadConfig.MAX_FILE_SIZE,
              `The file is too large. The maximum allowed size is... ${uploadConfig.MAX_SIZE} bytes`,
            ),
        })
        .passthrough()

      const { file } = fileSchema.parse(request.file)

      response.json({ message: 'File uploaded successfully' })
    } catch (error) {
      throw error
    }
  }
}

export { UploadsController }
