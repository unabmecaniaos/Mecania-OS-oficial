import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getHistoryByVin } from "@/modules/service-history/service-history.service";

export const GET = handleApiRoute(async (request: Request) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get("vin");

    const history = await getHistoryByVin(vin ?? "");
    return apiResponse(history);
});