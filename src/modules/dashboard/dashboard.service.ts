import { UserRole, WorkOrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { isWorkOrderDelayed } from "@/modules/work-orders/work-order.constants";

export async function getDashboardSummary(input?: { actorId?: string; actorRole?: UserRole }) {
  const workOrderWhere: Prisma.WorkOrderWhereInput =
    input?.actorRole === UserRole.MECHANIC && input.actorId
      ? {
          assignedTechnicianId: input.actorId,
        }
      : {};

  const [
    clients,
    vehicles,
    activeOrders,
    awaitingApproval,
    readyForDelivery,
    latestOrders,
    overdueOrdersRaw,
  ] =
    await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.workOrder.count({
        where: {
          ...workOrderWhere,
          status: {
            in: [
              WorkOrderStatus.RECEIVED,
              WorkOrderStatus.IN_DIAGNOSIS,
              WorkOrderStatus.WAITING_APPROVAL,
              WorkOrderStatus.WAITING_PARTS,
              WorkOrderStatus.IN_REPAIR,
              WorkOrderStatus.IN_PAINT,
              WorkOrderStatus.READY_FOR_DELIVERY,
            ],
          },
        },
      }),
      prisma.workOrder.count({
        where: {
          ...workOrderWhere,
          status: WorkOrderStatus.WAITING_APPROVAL,
        },
      }),
      prisma.workOrder.count({
        where: {
          ...workOrderWhere,
          status: WorkOrderStatus.READY_FOR_DELIVERY,
        },
      }),
      prisma.workOrder.findMany({
        where: workOrderWhere,
        include: {
          client: true,
          assignedTechnician: true,
          vehicle: true,
        },
        orderBy: {
          intakeDate: "desc",
        },
        take: 5,
      }),
      prisma.workOrder.findMany({
        where: {
          ...workOrderWhere,
          estimatedDate: {
            not: null,
          },
        },
        select: {
          status: true,
          estimatedDate: true,
        },
      }),
    ]);

  const overdueOrders = overdueOrdersRaw.filter((order) =>
    isWorkOrderDelayed({
      status: order.status,
      promisedDate: order.estimatedDate,
    }),
  ).length;

  return {
    clients,
    vehicles,
    activeOrders,
    awaitingApproval,
    readyForDelivery,
    overdueOrders,
    latestOrders,
  };
}
