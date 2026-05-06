import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getWorkOrderById, updateWorkOrder } from "@/modules/work-orders/work-order.service";

type WorkOrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = handleApiRoute(async (_request: Request, context: WorkOrderRouteContext) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const workOrder = await getWorkOrderById(id);
    return apiResponse(workOrder);
});

export const PATCH = handleApiRoute(async (request: Request, context: WorkOrderRouteContext) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const body = await request.json();
    const workOrder = await updateWorkOrder(id, body, session.user.id);
    return apiResponse(workOrder);
});