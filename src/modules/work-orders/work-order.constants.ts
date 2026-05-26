import { WorkOrderStatus, WorkOrderTaskStatus } from "@prisma/client";

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  RECEIVED: "Recibido",
  IN_DIAGNOSIS: "En diagnostico",
  WAITING_APPROVAL: "Esperando aprobacion",
  WAITING_PARTS: "Esperando repuestos",
  IN_REPAIR: "En reparacion",
  IN_PAINT: "En pintura",
  READY_FOR_DELIVERY: "Listo para entrega",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const WORK_ORDER_STATUS_OPTIONS = Object.entries(WORK_ORDER_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as WorkOrderStatus,
    label,
  }),
);

export const WORK_ORDER_PROGRESS_FLOW: WorkOrderStatus[] = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.IN_DIAGNOSIS,
  WorkOrderStatus.WAITING_APPROVAL,
  WorkOrderStatus.WAITING_PARTS,
  WorkOrderStatus.IN_REPAIR,
  WorkOrderStatus.IN_PAINT,
  WorkOrderStatus.READY_FOR_DELIVERY,
  WorkOrderStatus.DELIVERED,
];

export function getWorkOrderProgressPercent(status: WorkOrderStatus) {
  if (status === WorkOrderStatus.CANCELLED) {
    return 0;
  }

  const index = WORK_ORDER_PROGRESS_FLOW.indexOf(status);

  if (index === -1) {
    return 0;
  }

  return Math.round(((index + 1) / WORK_ORDER_PROGRESS_FLOW.length) * 100);
}

export function isClosedStatus(status: WorkOrderStatus) {
  return status === WorkOrderStatus.DELIVERED || status === WorkOrderStatus.CANCELLED;
}

type WorkOrderTaskProgressRecord = {
  status: WorkOrderTaskStatus;
};

export function getWorkOrderTasksProgressPercent(tasks: WorkOrderTaskProgressRecord[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter(
    (task) => task.status === WorkOrderTaskStatus.COMPLETED,
  ).length;

  return Math.round((completedTasks / tasks.length) * 100);
}

export function getWorkOrderAutomaticProgressPercent(input: {
  status: WorkOrderStatus;
  tasks?: WorkOrderTaskProgressRecord[];
}) {
  if (input.tasks && input.tasks.length > 0) {
    return getWorkOrderTasksProgressPercent(input.tasks);
  }

  return getWorkOrderProgressPercent(input.status);
}

export const WORK_ORDER_TASK_STATUS_LABELS: Record<WorkOrderTaskStatus, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completada",
};

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isWorkOrderDelayed(input: {
  status: WorkOrderStatus;
  promisedDate?: Date | string | null;
  referenceDate?: Date;
}) {
  if (isClosedStatus(input.status) || !input.promisedDate) {
    return false;
  }

  const promisedDate =
    input.promisedDate instanceof Date ? input.promisedDate : new Date(input.promisedDate);

  return promisedDate < startOfDay(input.referenceDate ?? new Date());
}
