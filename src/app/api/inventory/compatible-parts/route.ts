import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getCompatiblePartsByVin } from "@/modules/inventory/inventory.service";

export const GET = handleApiRoute(async (request: Request) => {
  await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin") ?? "";

  return apiResponse(await getCompatiblePartsByVin(vin));
});
