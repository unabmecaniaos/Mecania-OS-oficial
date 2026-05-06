import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getVehicleById, updateVehicle } from "@/modules/vehicles/vehicle.service";

type VehicleRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = handleApiRoute(async (_request: Request, context: VehicleRouteContext) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const vehicle = await getVehicleById(id);
    return apiResponse(vehicle);
});

export const PATCH = handleApiRoute(async (request: Request, context: VehicleRouteContext) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const body = await request.json();
    const vehicle = await updateVehicle(id, body, session.user.id);
    return apiResponse(vehicle);
});