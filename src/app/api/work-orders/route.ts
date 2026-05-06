import { UserRole, WorkOrderStatus } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createWorkOrder, listWorkOrders } from "@/modules/work-orders/work-order.service";

export const GET = handleApiRoute(async (request: Request) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const workOrders = await listWorkOrders({
      search: searchParams.get("q") ?? undefined,
      status:
        statusParam && statusParam in WorkOrderStatus
          ? (statusParam as WorkOrderStatus)
          : undefined,
    });
    return apiResponse(workOrders);
});

export const POST = handleApiRoute(async (request: Request) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const body = await request.json();
    const workOrder = await createWorkOrder(body, session.user.id);
    return apiResponse(workOrder, 201);
});