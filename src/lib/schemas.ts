import z from "zod";
import { isValidBase64Image } from "./functions";

/**
 * Schemas to get the correct params from the requests
 */

export const uploadSchema = z.object({
  customer_code: z.string({
    invalid_type_error: "O código deve ser uma string",
    required_error: "Por favor, insira o código do cliente",
  }),
  measure_datetime: z
    .string({
      invalid_type_error: "A data deve ser uma string",
      required_error: "Por favor, insira a data da medição",
    })
    .datetime("Insira uma data válida no formato ISO 8601"),
  measure_type: z
    .string({
      invalid_type_error: "O tipo deve ser uma string",
      required_error: "Por favor, insira o tipo da medição",
    })
    .refine(
      (type) => type === "GAS" || type === "WATER",
      `O tipo deve ser "GAS" ou "WATER"`
    ),
  image: z
    .string({
      invalid_type_error: "A imagem precisa ser uma string",
      required_error: "É necessário enviar a imagem",
    })
    // Verify if the image is a valid base64 image
    .refine((image) => isValidBase64Image(image), {
      message: "A imagem precisa ser no formato base64",
    }),
});

export const confirmSchema = z.object({
  measure_uuid: z.string({
    required_error: "Por favor, insira a id",
    invalid_type_error: "A id deve ser uma string",
  }),
  confirmed_value: z
    .number({
      invalid_type_error: "O valor deve ser um número inteiro",
      required_error: "Por favor, insira o valor",
    })
    .int("O valor deve ser um número inteiro"),
});

export const listParamsSchema = z.object({
  customer_code: z.string(),
});

export const listQuerySchema = z.object({
  measure_type: z
    .string()
    .refine((type) => type === "GAS" || type === "WATER")
    .optional(),
});
