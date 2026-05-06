import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createVehicle, listVehicles } from "@/modules/vehicles/vehicle.service";

export const GET = handleApiRoute(async (request: Request) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const vehicles = await listVehicles(searchParams.get("q") ?? undefined);
    return apiResponse(vehicles);
});

export const POST = handleApiRoute(async (request: Request) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const body = await request.json();
    const vehicle = await createVehicle(body, session.user.id);
    return apiResponse(vehicle, 201);
});