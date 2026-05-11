"use client";

import { useActionState } from "react";

import { createWorkOrderTaskAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

type WorkOrderTaskFormProps = {
  orderId: string;
};

export function WorkOrderTaskForm({ orderId }: WorkOrderTaskFormProps) {
  const [state, formAction] = useActionState(createWorkOrderTaskAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="orderId" type="hidden" value={orderId} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="task-title">
          Nombre de la tarea
        </label>
        <Input id="task-title" name="title" placeholder="Ej. Desmontar parachoque delantero" />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[color:var(--foreground)]"
          htmlFor="task-description"
        >
          Detalle opcional
        </label>
        <Textarea
          id="task-description"
          name="description"
          placeholder="Agrega contexto o instrucciones para esta tarea"
          rows={3}
        />
      </div>
      <FormMessage message={state.error} />
      <SubmitButton label="Agregar tarea" pendingLabel="Agregando..." />
    </form>
  );
}
