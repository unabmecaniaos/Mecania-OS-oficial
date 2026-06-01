import { PrismaClient } from "@prisma/client";

import { getVinFormatError, normalizeVin } from "@/lib/vin";

const prisma = new PrismaClient();

async function main() {
  const [vehicles, snapshots] = await Promise.all([
    prisma.vehicle.findMany({
      select: {
        id: true,
        vin: true,
        make: true,
        model: true,
        plate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.selfInspectionVehicleSnapshot.findMany({
      select: {
        id: true,
        vin: true,
        make: true,
        model: true,
        plate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const invalidVehicles = vehicles
    .map((vehicle) => ({
      ...vehicle,
      vin: normalizeVin(vehicle.vin),
      issue: getVinFormatError(vehicle.vin),
    }))
    .filter((vehicle) => vehicle.issue !== null);
  const invalidSnapshots = snapshots
    .filter((snapshot) => snapshot.vin)
    .map((snapshot) => ({
      ...snapshot,
      vin: normalizeVin(snapshot.vin ?? ""),
      issue: getVinFormatError(snapshot.vin ?? ""),
    }))
    .filter((snapshot) => snapshot.issue !== null);

  console.log(
    JSON.stringify(
      {
        vehicles: {
          total: vehicles.length,
          invalid: invalidVehicles.length,
          examples: invalidVehicles.slice(0, 20),
        },
        selfInspectionVehicleSnapshots: {
          total: snapshots.length,
          invalid: invalidSnapshots.length,
          examples: invalidSnapshots.slice(0, 20),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
