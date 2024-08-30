import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import z, { ZodError } from "zod";
import { verifyIfHasAlreadyConsulted, extractNumbers } from "../lib/functions";
import { AppError } from "../lib/helpers";
import { converBase64ToImage } from "convert-base64-to-image";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { uploadSchema } from "../lib/schemas";

// Configure the Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const router = Router();

const prisma = new PrismaClient();

router.post("/upload", async (req: Request, res: Response) => {
  try {
    // Get the correctly parameters
    const { customer_code, measure_datetime, measure_type, image } =
      uploadSchema.parse(req.body);

    await verifyIfHasAlreadyConsulted(
      customer_code,
      measure_type,
      measure_datetime
    );

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
      {
        text: `The image you received is a ${measure_type.toLowerCase} meter, please return to me ONLY the number of the meter. The numbers are in the center of the meter`,
      },
    ]);

    const measureQuantity = extractNumbers(result.response.text());

    // Create the record of this customer
    const customer = await prisma.customer.create({
      data: {
        code: customer_code,
      },
    });

    // Get the response and create the record of the measure
    const measure = await prisma.measure.create({
      data: {
        type: measure_type,
        measureDatetime: new Date(measure_datetime),
        confirmed: false,
        customerId: customer.id,
        imageUrl: image,
      },
    });

    // TODO: Create a temporary link

    return res.status(200).json({
      image_url: "",
      measure_value: measureQuantity,
      measure_uuid: measure.id,
    });
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
      error_description: error,
    });
  }
});

router.get("/registers", async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany();
  const measures = await prisma.measure.findMany();

  return res.json({ customers, measures });
});

router.get("/gemini", async (req: Request, res: Response) => {
  const { prompt } = req.body;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return res.json(text);
});

export default router;
