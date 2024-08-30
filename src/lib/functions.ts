import { PrismaClient } from "@prisma/client";
import { AppError } from "./helpers";

export function isValidBase64Image(base64String: string) {
  // Regex to verify the string prefix to base64 images
  const base64ImageRegex = /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/;

  // Verify if the string starts with a valid prefix
  if (!base64ImageRegex.test(base64String)) {
    return false;
  }

  // Removes the prefix and verify if the remaining characters are valid in base64
  const base64Data = base64String.replace(base64ImageRegex, "");

  try {
    // Tries to decode the base64 string
    atob(base64Data);
    return true;
  } catch (e) {
    return false;
  }
}

export async function verifyIfHasAlreadyConsulted(
  customer_code: string,
  measure_type: string,
  measure_datetime: string
) {
  const prisma = new PrismaClient();

  const startOfMonth = new Date(measure_datetime);
  startOfMonth.setDate(1); // First day of the month
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1); // First day of the next month
  endOfMonth.setHours(0, 0, 0, 0);

  // Verify if the user has already taken one measure in this month of this type
  const hasAlreadyConsulted = await prisma.customer.findMany({
    where: {
      code: customer_code,
      measures: {
        some: {
          measureDatetime: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
          type: measure_type,
        },
      },
    },
  });

  const hasAlreadyConsultedVerification =
    hasAlreadyConsulted !== null &&
    hasAlreadyConsulted !== undefined &&
    hasAlreadyConsulted.length > 0;

  if (hasAlreadyConsultedVerification) {
    throw new AppError(409, "DOUBLE_REPORT", "Leitura do mês já realizada");
  }
}

export function extractNumbers(str: string): number {
  return Number(str.replace(/\D/g, "")); // Replace all the characters that are not numbers with empty strings
}
