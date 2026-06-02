import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { decodeVehicleVin } from "@/modules/vehicles/vin-decoder.service";

export const GET = handleApiRoute(async (request: Request) => {
  await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
  const { searchParams } = new URL(request.url);

  return apiResponse(await decodeVehicleVin(searchParams.get("vin") ?? ""));
});
