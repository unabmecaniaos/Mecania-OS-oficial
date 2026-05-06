import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { updateWorkOrderStatus } from "@/modules/work-orders/work-order.service";

type WorkOrderStatusContext = {
  params: Promise<{
    id: string;
  }>;
};

export const PATCH = handleApiRoute(async (request: Request, context: WorkOrderStatusContext) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const body = await request.json();
    const workOrder = await updateWorkOrderStatus(id, body, session.user.id);
    return apiResponse(workOrder);
});