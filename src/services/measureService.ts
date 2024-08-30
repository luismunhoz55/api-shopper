import { PrismaClient } from "@prisma/client";
import { Measure } from "../lib/interfaces";

const prisma = new PrismaClient();

export async function createMeasure(data: {
  type: string;
  measureDatetime: Date;
  measureQuantity: number;
  customerId: string;
  imageUrl: string;
}): Promise<Measure> {
  return await prisma.measure.create({
    data: {
      type: data.type,
      measureDatetime: data.measureDatetime,
      confirmed: false,
      value: data.measureQuantity,
      customerId: data.customerId,
      imageUrl: data.imageUrl,
    },
  });
}

export async function getMeasure(measure_uuid: string): Promise<Measure> {
  return await prisma.measure.findUnique({
    where: {
      id: measure_uuid,
    },
  });
}

export async function getMeasureByCustomerId(
  customerId: string,
  measure_type: string | undefined
): Promise<Array<Measure>> {
  return await prisma.measure.findMany({
    where: { customerId, type: measure_type },
  });
}

export async function updateMeasure(
  measure_uuid: string,
  confirmed_value: number,
  confirmed: boolean
): Promise<Measure> {
  return await prisma.measure.update({
    where: {
      id: measure_uuid,
    },
    data: {
      value: confirmed_value,
      confirmed: confirmed,
    },
  });
}
