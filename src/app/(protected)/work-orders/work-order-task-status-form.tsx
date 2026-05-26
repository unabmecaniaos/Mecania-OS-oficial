"use client";

import { WorkOrderTaskStatus } from "@prisma/client";
import { useActionState } from "react";

import { updateWorkOrderTaskStatusAction } from "@/app/(protected)/work-orders/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState } from "@/lib/form-state";

type WorkOrderTaskStatusFormProps = {
  orderId: string;
  taskId: string;
  status: WorkOrderTaskStatus;
};

export function WorkOrderTaskStatusForm({
  orderId,
  taskId,
  status,
}: WorkOrderTaskStatusFormProps) {
  const [state, formAction] = useActionState(updateWorkOrderTaskStatusAction, initialActionState);
  const nextStatus =
    status === WorkOrderTaskStatus.COMPLETED
      ? WorkOrderTaskStatus.PENDING
      : WorkOrderTaskStatus.COMPLETED;

  return (
    <form action={formAction} className="space-y-2">
      <input name="orderId" type="hidden" value={orderId} />
      <input name="taskId" type="hidden" value={taskId} />
      <input name="status" type="hidden" value={nextStatus} />
      <Button type="submit" variant={status === WorkOrderTaskStatus.COMPLETED ? "secondary" : "primary"}>
        {status === WorkOrderTaskStatus.COMPLETED ? "Marcar pendiente" : "Marcar completada"}
      </Button>
      <FormMessage message={state.error} />
    </form>
  );
}
