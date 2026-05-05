import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "@/modules/vehicles/vehicle.schemas";
import { vehicleRepository } from "@/modules/vehicles/vehicle.repository";

async function assertClientExists(clientId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      deletedAt: null,
      isWorkshopClient: true,
    },
    select: { id: true },
  });

  if (!client) {
    throw new NotFoundError("Cliente no encontrado");
  }
}

export async function listVehicles(search?: string) {
  return vehicleRepository.list(search?.trim());
}

export async function getVehicleById(id: string) {
  const vehicle = await vehicleRepository.findById(id);

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado");
  }

  return vehicle;
}

export async function searchVehicle(input: { vin?: string; plate?: string }) {
  const vehicle = await vehicleRepository.findByVinOrPlate(input);

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado");
  }

  return vehicle;
}

export async function createVehicle(input: unknown) {
  const data = createVehicleSchema.parse(input);
  await assertClientExists(data.clientId);

  return vehicleRepository.create({
    client: {
      connect: {
        id: data.clientId,
      },
    },
    plate: data.plate,
    vin: data.vin,
    make: data.make,
    model: data.model,
    year: data.year,
    color: data.color,
    mileage: data.mileage,
  });
}

export async function updateVehicle(id: string, input: unknown) {
  const data = updateVehicleSchema.parse(input);

  return vehicleRepository.update(id, {
    plate: data.plate,
    vin: data.vin,
    make: data.make,
    model: data.model,
    year: data.year,
    color: data.color,
    mileage: data.mileage,
  });
}
