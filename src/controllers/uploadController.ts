import { Request, Response } from "express";
import { uploadSchema } from "../lib/schemas";
import { ZodError } from "zod";
import { AppError } from "../lib/error";
import {
  createCustomer,
  getCustomer,
  verifyIfHasAlreadyConsultedService,
} from "../services/customerService";
import { createMeasure } from "../services/measureService";
import { uploadAndAnalyzeImage } from "../services/imageService";
import { v4 as uuidv4 } from "uuid";
import { converBase64ToImage } from "convert-base64-to-image";

export async function uploadHandler(req: Request, res: Response) {
  try {
    const { customer_code, measure_datetime, measure_type, image } =
      uploadSchema.parse(req.body);

    await verifyIfHasAlreadyConsultedService(
      customer_code,
      measure_type,
      measure_datetime
    );

    const imageId = uuidv4();
    const imageName = `image${imageId}.jpg`;
    const pathToSaveImage = `./src/images/${imageName}`;

    await converBase64ToImage(image, pathToSaveImage);

    const measureQuantity = await uploadAndAnalyzeImage(
      pathToSaveImage,
      measure_type
    );

    let customer = await getCustomer(customer_code);

    if (customer === null) {
      customer = await createCustomer(customer_code);
    }

    const measure = await createMeasure({
      type: measure_type,
      measureDatetime: new Date(measure_datetime),
      measureQuantity,
      customerId: customer.id,
      imageUrl: image,
    });

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
}
