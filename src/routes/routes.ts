import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import z, { ZodError } from "zod";
import { isValidBase64Image } from "../lib/functions";
import { AppError } from "../lib/helpers";
import { converBase64ToImage } from "convert-base64-to-image";
import axios from "axios";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const router = Router();
const prisma = new PrismaClient();

router.post("/upload", async (req: Request, res: Response) => {
  const imageSchema = z.object({
    code: z.string({
      required_error: "Por favor, insira o código do consumidor",
      invalid_type_error: "O código deve ser uma string",
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
    // Get the correctly parameters
    const { code, image } = imageSchema.parse(req.body);

    await verifyIfHasAlreadyConsulted(code);

    // Create the record of this customer
    const customer = await prisma.customer.create({
      data: {
        code,
      },
    });

    // Convert the image and verify if it's valid
    const base64 = image;
    const pathToSaveImage = "./images/image.jpg";

    await converBase64ToImage(base64, pathToSaveImage);

    // Upload the file and specify a display name.
    const uploadResponse = await fileManager.uploadFile(pathToSaveImage, {
      mimeType: "image/jpeg",
      displayName: "Water Gas measure",
    });

    // Ask the model to inspect the image
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      },
      { text: "Describe the image." },
    ]);

    console.log(result.response.text());

    // Get the response and create the record of the measure
    await prisma.measure.create({
      data: {
        type: "WATER",
        confirmed: false,
        imageUrl: image,
        customerId: customer.id,
      },
    });

    // Create a temporary link

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

router.get("/gemini", async (req: Request, res: Response) => {
  const { prompt } = req.body;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return res.json(text);
});

async function verifyIfHasAlreadyConsulted(code: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1); // First day of the month
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1); // First day of the next month
  endOfMonth.setHours(0, 0, 0, 0);

  // Verify if the user has already taken one measure this month
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
}

export default router;
