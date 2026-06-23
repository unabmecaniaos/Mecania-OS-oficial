"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  createTimeOffRequest,
  reviewTimeOffRequest,
} from "@/modules/time-off/time-off.service";

export async function createTimeOffRequestAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createTimeOffRequestAction", async () => {
    const session = await requireApiUser([UserRole.MECHANIC]);

    await createTimeOffRequest(
      {
        type: String(formData.get("type") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      },
      {
        id: session.user.id,
        role: session.user.role,
      },
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/time-off");
  return {
    success: "Solicitud enviada correctamente.",
  };
}

export async function reviewTimeOffRequestAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const result = await executeServerAction("reviewTimeOffRequestAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await reviewTimeOffRequest(
      requestId,
      {
        status: String(formData.get("status") ?? ""),
        reviewNote: String(formData.get("reviewNote") ?? ""),
      },
      {
        id: session.user.id,
        role: session.user.role,
      },
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/time-off");
  return {
    success: "Solicitud revisada correctamente.",
  };
}
