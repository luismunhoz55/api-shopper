import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { verifyIfHasAlreadyConsulted, extractNumbers } from "../lib/functions";
import { AppError } from "../lib/error";
import { converBase64ToImage } from "convert-base64-to-image";
import { v4 as uuidv4 } from "uuid";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import {
  uploadSchema,
  confirmSchema,
  listParamsSchema,
  listQuerySchema,
} from "../lib/schemas";
import { Measure } from "../lib/interfaces";

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
    const imageId = uuidv4();
    const base64 = image;
    const imageName = `image${imageId}.jpg`;
    const pathToSaveImage = `./src/images/${imageName}`;

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

    // Get the quantity measured by Gemini
    const measureQuantity = extractNumbers(result.response.text());

    // Find or create the record of this customer
    let customer = await prisma.customer.findUnique({
      where: {
        code: customer_code,
      },
    });

    if (customer === null || customer.length === 0) {
      customer = await prisma.customer.create({
        data: {
          code: customer_code,
        },
      });
    }

    // Get the response and create the record of the measure
    const measure = await prisma.measure.create({
      data: {
        type: measure_type,
        measureDatetime: new Date(measure_datetime),
        confirmed: false,
        value: measureQuantity,
        customerId: customer.id,
        imageUrl: image,
      },
    });

    // TODO: Create a temporary link
    const imageLink = `${req.protocol}://${req.get(
      "host"
    )}/static/${imageName}`;

    return res.status(200).json({
      image_url: imageLink,
      measure_value: measureQuantity,
      measure_uuid: measure.id,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error_code: "INVALID_DATA",
        error_description: error.issues[0].message,
      });
    }

    if (error instanceof AppError) {
      return res.status(error.status_code).json({
        error_code: error.error_code,
        error_description: error.error_description,
      });
    }

    res.status(400).json({
      error_code: "ERROR",
      error_description: error,
    });
  }
});

router.patch("/confirm", async (req: Request, res: Response) => {
  try {
    const { measure_uuid, confirmed_value } = confirmSchema.parse(req.body);

    const measure = await prisma.measure.findUnique({
      where: {
        id: measure_uuid,
      },
    });

    if (measure == null || measure == undefined) {
      throw new AppError(404, "MEASURE_NOT_FOUND", "Leitura não encontrada");
    }

    if (measure.confirmed == true) {
      throw new AppError(
        409,
        "CONFIRMATION_DUPLICATE",
        "Leitura do mês já realizada"
      );
    }

    await prisma.measure.update({
      where: {
        id: measure_uuid,
      },
      data: {
        value: confirmed_value,
        confirmed: true,
      },
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error_code: "INVALID_DATA",
        error_description: error.issues[0].message,
      });
    }

    if (error instanceof AppError) {
      return res.status(error.status_code).json({
        error_code: error.error_code,
        error_description: error.error_description,
      });
    }

    res.status(400).json({
      error_code: "ERROR",
      error_description: error,
    });
  }
});

router.get("/:customer_code/list", async (req: Request, res: Response) => {
  try {
    const { customer_code } = listParamsSchema.parse(req.params);

    const { measure_type } = listQuerySchema.parse(req.query);

    const customer = await prisma.customer.findMany({
      where: {
        code: customer_code,
      },
    });

    if (customer === null || customer.length === 0) {
      throw new AppError(
        404,
        "MEASURES_NOT_FOUND",
        "Nenhuma leitura encontrada"
      );
    }

    const measures = await prisma.measure.findMany({
      where: {
        customerId: customer.id,
        type: measure_type,
      },
    });

    if (measures === null || measures.length === 0) {
      throw new AppError(
        404,
        "MEASURES_NOT_FOUND",
        "Nenhuma leitura encontrada"
      );
    }

    const formattedMeasures = measures.map((measure: Measure) => ({
      measure_uuid: measure.id,
      measure_datetime: new Date(measure.measureDatetime),
      measure_type: measure.type,
      has_confirmed: measure.confirmed,
      image_url: measure.imageUrl,
    }));

    res.status(200).json({
      customer_code: customer_code,
      measures: formattedMeasures,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error_code: "INVALID_TYPE",
        error_description: "Tipo de medição não permitida",
      });
    }

    if (error instanceof AppError) {
      return res.status(error.status_code).json({
        error_code: error.error_code,
        error_description: error.error_description,
      });
    }

    res.status(400).json({
      error_code: "ERROR",
      error_description: error,
    });
  }
});

export default router;
