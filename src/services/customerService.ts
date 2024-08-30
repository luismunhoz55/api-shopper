import { PrismaClient } from "@prisma/client";
import { AppError } from "../lib/error";
import { Customer } from "../lib/interfaces";

const prisma = new PrismaClient();

export async function createCustomer(customer_code: string): Promise<Customer> {
  return await prisma.customer.create({
    data: {
      code: customer_code,
    },
  });
}

export async function getCustomer(customer_code: string): Promise<Customer> {
  return await prisma.customer.findUnique({
    where: {
      code: customer_code,
    },
  });
}

export async function verifyIfHasAlreadyConsultedService(
  customer_code: string,
  measure_type: string,
  measure_datetime: string
): Promise<boolean> {
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
  return false;
}
