import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import z, { ZodError } from "zod";
import { isValidBase64Image } from "../lib/functions";
import { AppError } from "../lib/helpers";

const router = Router();
const prisma = new PrismaClient();

router.post("/upload", async (req: Request, res: Response) => {
  // Verify if the user has already taken one measure this month

  const imageSchema = z.object({
    code: z.string({
      required_error: "Por favor, insira o código do consumidor",
    }),
    image: z
      .string({
        required_error: "É necessário enviar a imagem",
        invalid_type_error: "A imagem precisa ser uma string",
      })
      // Verify if the image is a valid base64 image
      .refine((image) => isValidBase64Image(image), {
        message: "A imagem precisa ser no formato base64",
      }),
  });

  try {
    const { code, image } = imageSchema.parse(req.body);

    const startOfMonth = new Date();
    startOfMonth.setDate(1); // Primeiro dia do mês
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Primeiro dia do próximo mês
    endOfMonth.setHours(0, 0, 0, 0);

    const hasAlreadyConsulted = await prisma.customer.findMany({
      where: {
        code,
        measures: {
          some: {
            createdAt: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        },
      },
    });

    const hasAlreadyConsultedVerification =
      hasAlreadyConsulted !== null &&
      hasAlreadyConsulted !== undefined &&
      hasAlreadyConsulted.length > 0;

    if (hasAlreadyConsultedVerification) {
      throw new AppError("Leitura do mês já realizada");
    }

    const customer = await prisma.customer.create({
      data: {
        code,
      },
    });

    await prisma.measure.create({
      data: {
        type: "WATER",
        confirmed: false,
        imageUrl: image,
        customerId: customer.id,
      },
    });

    // Send the image to gemini

    return res.status(200).json({ message: "ok" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(409).json({
        error_code: "INVALID_DATA",
        error_description: error.issues[0].message,
      });
    }

    if (error instanceof AppError) {
      return res.status(409).json({
        error_code: "DOUBLE_REPORT",
        error_description: error.message,
      });
    }

    res.status(400).json({
      error_code: "ERROR",
      error_description: "Erro desconhecido",
    });
  }
});

export default router;
