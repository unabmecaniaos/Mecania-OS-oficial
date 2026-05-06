import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getHistoryByVehicleId } from "@/modules/service-history/service-history.service";

type VehicleHistoryContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = handleApiRoute(async (_request: Request, context: VehicleHistoryContext) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const history = await getHistoryByVehicleId(id);
    return apiResponse(history);
});