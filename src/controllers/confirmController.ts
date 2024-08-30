import { Request, Response } from "express";
import { confirmSchema } from "../lib/schemas";
import { getMeasure, updateMeasure } from "../services/measureService";
import { AppError } from "../lib/error";
import { ZodError } from "zod";

export async function confirmHandler(req: Request, res: Response) {
  try {
    const { measure_uuid, confirmed_value } = confirmSchema.parse(req.body);

    const measure = await getMeasure(measure_uuid);

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

    await updateMeasure(measure_uuid, confirmed_value, true);

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
}
