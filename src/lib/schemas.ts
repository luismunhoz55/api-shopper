import z from "zod";
import { isValidBase64Image } from "./functions";

/**
 * Schemas to get the correct params from the request
 */

export const uploadSchema = z.object({
  customer_code: z.string({
    invalid_type_error: "O código deve ser uma string",
    required_error: "Por favor, insira o código do consumidor",
  }),
  measure_datetime: z
    .string({
      invalid_type_error: "A data deve ser uma string",
      required_error: "Por favor, insira a data da medição",
    })
    .date("Insira uma data válida no formato YYYY-MM-DD"),
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
