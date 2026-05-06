import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getSelfInspectionById } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = handleApiRoute(async (_request: Request, { params }: RouteContext) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await params;
    const inspection = await getSelfInspectionById(id);

    return apiResponse(inspection);
});