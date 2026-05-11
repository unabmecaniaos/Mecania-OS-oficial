"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  addWorkOrderEvidence,
  createWorkOrderTask,
  createWorkOrder,
  updateWorkOrderAssignment,
  updateWorkOrderStatus,
  updateWorkOrderTaskStatus,
} from "@/modules/work-orders/work-order.service";
import { setWorkOrderPartUsage } from "@/modules/inventory/inventory.service";

export async function createWorkOrderAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createWorkOrderAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await createWorkOrder(
      {
        clientId: String(formData.get("clientId") ?? ""),
        vehicleId: String(formData.get("vehicleId") ?? ""),
        assignedTechnicianId: String(formData.get("assignedTechnicianId") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        initialDiagnosis: String(formData.get("initialDiagnosis") ?? ""),
        status: String(formData.get("status") ?? ""),
        estimatedDate: String(formData.get("estimatedDate") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/work-orders");
  await setFlashMessage({
    message: "Orden de trabajo creada correctamente.",
    tone: "success",
  });
  redirect("/work-orders");
}

export async function updateWorkOrderAssignmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const result = await executeServerAction("updateWorkOrderAssignmentAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await updateWorkOrderAssignment(
      orderId,
      {
        assignedTechnicianId: String(formData.get("assignedTechnicianId") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  revalidatePath("/liquidador");
  await setFlashMessage({
    message: "Responsable actualizado correctamente.",
    tone: "success",
  });
  redirect(`/work-orders/${orderId}`);
}

export async function updateWorkOrderStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const result = await executeServerAction("updateWorkOrderStatusAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await updateWorkOrderStatus(
      orderId,
      {
        status: String(formData.get("status") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  revalidatePath("/liquidador");
  await setFlashMessage({
    message: "Estado de la orden actualizado correctamente.",
    tone: "success",
  });
  redirect(`/work-orders/${orderId}`);
}

export async function addWorkOrderEvidenceAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const file = formData.get("file");
  const result = await executeServerAction("addWorkOrderEvidenceAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    if (!(file instanceof File)) {
      throw new Error("Debe adjuntar una imagen");
    }

    await addWorkOrderEvidence(
      orderId,
      {
        file,
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/work-orders/${orderId}`);
  revalidatePath("/liquidador");
  await setFlashMessage({
    message: "Evidencia subida correctamente.",
    tone: "success",
  });
  redirect(`/work-orders/${orderId}`);
}

export async function setWorkOrderPartUsageAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const result = await executeServerAction("setWorkOrderPartUsageAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await setWorkOrderPartUsage(
      orderId,
      {
        repuestoId: String(formData.get("repuestoId") ?? ""),
        quantity: String(formData.get("quantity") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/inventory");
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  revalidatePath("/liquidador");
  await setFlashMessage({
    message: "Uso de repuesto actualizado correctamente.",
    tone: "success",
  });
  redirect(`/work-orders/${orderId}`);
}

export async function createWorkOrderTaskAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const result = await executeServerAction("createWorkOrderTaskAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await createWorkOrderTask(
      orderId,
      {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  await setFlashMessage({
    message: "Tarea agregada correctamente a la orden.",
    tone: "success",
  });
  redirect(`/work-orders/${orderId}`);
}

export async function updateWorkOrderTaskStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const result = await executeServerAction("updateWorkOrderTaskStatusAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await updateWorkOrderTaskStatus(
      orderId,
      taskId,
      {
        status: String(formData.get("status") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  await setFlashMessage({
    message: "Estado de la tarea actualizado correctamente.",
    tone: "success",
  });
  redirect(`/work-orders/${orderId}`);
}
