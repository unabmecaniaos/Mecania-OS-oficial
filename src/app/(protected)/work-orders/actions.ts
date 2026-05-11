"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { getErrorMessage } from "@/lib/errors";
import type { ActionState } from "@/lib/form-state";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  addWorkOrderEvidence,
  createWorkOrder,
  updateWorkOrderAssignment,
  updateWorkOrderPromisedDate,
  updateWorkOrderStatus,
} from "@/modules/work-orders/work-order.service";

export async function createWorkOrderAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await requireApiUser();

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
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/work-orders");
  redirect("/work-orders");
}

export async function updateWorkOrderAssignmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    const session = await requireApiUser();

    await updateWorkOrderAssignment(
      orderId,
      {
        assignedTechnicianId: String(formData.get("assignedTechnicianId") ?? ""),
      },
      session.user.id,
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  redirect(`/work-orders/${orderId}`);
}

export async function updateWorkOrderPromisedDateAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    const session = await requireApiUser();

    await updateWorkOrderPromisedDate(
      orderId,
      {
        estimatedDate: String(formData.get("estimatedDate") ?? ""),
      },
      session.user.id,
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  redirect(`/work-orders/${orderId}`);
}

export async function updateWorkOrderStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    const session = await requireApiUser();

    await updateWorkOrderStatus(
      orderId,
      {
        status: String(formData.get("status") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${orderId}`);
  redirect(`/work-orders/${orderId}`);
}

export async function addWorkOrderEvidenceAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const file = formData.get("file");

  try {
    const session = await requireApiUser();

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
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath(`/work-orders/${orderId}`);
  redirect(`/work-orders/${orderId}`);
}
