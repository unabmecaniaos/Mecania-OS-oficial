import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { searchVehicle } from "@/modules/vehicles/vehicle.service";

export const GET = handleApiRoute(async (request: Request) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const vehicle = await searchVehicle({
      vin: searchParams.get("vin") ?? undefined,
      plate: searchParams.get("plate") ?? undefined,
    });
    return apiResponse(vehicle);
});