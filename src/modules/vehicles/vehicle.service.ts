import { NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "@/modules/vehicles/vehicle.schemas";
import { vehicleRepository } from "@/modules/vehicles/vehicle.repository";

const vehicleLogger = createLogger("vehicles");

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

export async function createVehicle(input: unknown, actorId?: string) {
  const data = createVehicleSchema.parse(input);
  await assertClientExists(data.clientId);

  const vehicle = await vehicleRepository.create({
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

  vehicleLogger.info("Vehicle created", {
    actorId,
    vehicleId: vehicle.id,
    clientId: data.clientId,
  });

  return vehicle;
}

export async function updateVehicle(id: string, input: unknown, actorId?: string) {
  const data = updateVehicleSchema.parse(input);

  const vehicle = await vehicleRepository.update(id, {
    plate: data.plate,
    vin: data.vin,
    make: data.make,
    model: data.model,
    year: data.year,
    color: data.color,
    mileage: data.mileage,
  });

  vehicleLogger.info("Vehicle updated", {
    actorId,
    vehicleId: vehicle.id,
  });

  return vehicle;
}
