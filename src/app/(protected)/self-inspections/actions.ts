"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  createSelfInspectionInvite,
  reviewSelfInspection,
  updateSelfInspectionStatus,
} from "@/modules/self-inspections/self-inspection.service";

export type InviteActionState = ActionState;

export async function createSelfInspectionInviteAction(
  _previousState: InviteActionState,
  _formData: FormData,
): Promise<InviteActionState> {
  const result = await executeServerAction("createSelfInspectionInviteAction", async () => {
    void _previousState;
    void _formData;
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    return createSelfInspectionInvite({}, session.user.id);
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/self-inspections");
  await setFlashMessage({
    message: "Autoinspeccion creada correctamente.",
    tone: "success",
  });
  redirect(`/self-inspections/${result.data.inspectionId}?token=${result.data.token}`);
}

export async function reviewSelfInspectionAction(
  inspectionId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("reviewSelfInspectionAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await reviewSelfInspection(
      inspectionId,
      {
        riskAssessment: String(formData.get("riskAssessment") ?? ""),
        internalSummary: String(formData.get("internalSummary") ?? ""),
        recommendedNextStep: String(formData.get("recommendedNextStep") ?? ""),
        departmentSuggestion: String(formData.get("departmentSuggestion") ?? ""),
        createWorkOrderSuggestion: formData.get("createWorkOrderSuggestion") === "on",
        createQuoteSuggestion: formData.get("createQuoteSuggestion") === "on",
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/self-inspections/${inspectionId}`);
  await setFlashMessage({
    message: "Revision guardada correctamente.",
    tone: "success",
  });
  redirect(`/self-inspections/${inspectionId}`);
}

export async function updateSelfInspectionStatusAction(
  inspectionId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("updateSelfInspectionStatusAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await updateSelfInspectionStatus(
      inspectionId,
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

  revalidatePath(`/self-inspections/${inspectionId}`);
  await setFlashMessage({
    message: "Estado actualizado correctamente.",
    tone: "success",
  });
  redirect(`/self-inspections/${inspectionId}`);
}
