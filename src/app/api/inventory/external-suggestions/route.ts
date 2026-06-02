import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getExternalPartSuggestions } from "@/modules/inventory/external-suggestions.service";

export const GET = handleApiRoute(async (request: Request) => {
  await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
  const { searchParams } = new URL(request.url);

  return apiResponse(
    await getExternalPartSuggestions({
      vin: searchParams.get("vin") ?? "",
      query: searchParams.get("query") ?? "",
      limit: Number(searchParams.get("limit") ?? 8),
    }),
  );
});
