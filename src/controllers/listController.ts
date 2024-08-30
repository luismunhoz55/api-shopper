import { Request, Response } from "express";
import { listParamsSchema, listQuerySchema } from "../lib/schemas";
import { getCustomer } from "../services/customerService";
import { AppError } from "../lib/error";
import { getMeasureByCustomerId } from "../services/measureService";
import { Measure } from "../lib/interfaces";
import { ZodError } from "zod";

export async function listHandler(req: Request, res: Response) {
  try {
    const { customer_code } = listParamsSchema.parse(req.params);

    const { measure_type } = listQuerySchema.parse(req.query);

    const customer = await getCustomer(customer_code);

    if (customer === null) {
      throw new AppError(
        404,
        "MEASURES_NOT_FOUND",
        "Nenhuma leitura encontrada"
      );
    }

    const measures = await getMeasureByCustomerId(customer.id, measure_type);

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
}
