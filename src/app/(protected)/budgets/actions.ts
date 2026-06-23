"use server";

import { BudgetItemType, BudgetStatus, UserRole } from "@prisma/client";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  parseBudgetCatalogSelections,
  parseBudgetLineUpdates,
  parseBudgetManualSelections,
} from "@/modules/budgets/budget-form";
import {
  createWorkOrderFromBudget,
  createLiquidatorBudgetDraft,
  createWorkshopBudgetDraft,
  transitionBudgetStatus,
  updateBudgetDraft,
} from "@/modules/budgets/budget.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkshopBudgetDraftAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createWorkshopBudgetDraftAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    return createWorkshopBudgetDraft(
      {
        clientId: String(formData.get("clientId") ?? ""),
        vehicleId: String(formData.get("vehicleId") ?? ""),
        selfInspectionId: String(formData.get("selfInspectionId") ?? ""),
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        workshopMarginPct: Number(formData.get("workshopMarginPct") ?? 25),
        discountAmount: Number(formData.get("discountAmount") ?? 0),
      },
      parseBudgetCatalogSelections(formData),
      parseBudgetManualSelections(formData),
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/budgets");
  await setFlashMessage({
    message: "Presupuesto creado correctamente.",
    tone: "success",
  });
  redirect(`/budgets/${result.data.id}`);
}

export async function createLiquidatorBudgetDraftAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createLiquidatorBudgetDraftAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    return createLiquidatorBudgetDraft(
      {
        insuranceCaseId: String(formData.get("insuranceCaseId") ?? ""),
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        workshopMarginPct: Number(formData.get("workshopMarginPct") ?? 25),
        discountAmount: Number(formData.get("discountAmount") ?? 0),
      },
      parseBudgetCatalogSelections(formData),
      parseBudgetManualSelections(formData),
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/budgets");
  revalidatePath("/work-orders");
  await setFlashMessage({
    message: "Presupuesto de liquidadora creado correctamente.",
    tone: "success",
  });
  redirect(`/budgets/${result.data.id}`);
}

export async function updateBudgetDraftAction(
  budgetId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("updateBudgetDraftAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await updateBudgetDraft(
      budgetId,
      {
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        workshopMarginPct: Number(formData.get("workshopMarginPct") ?? 25),
        discountAmount: Number(formData.get("discountAmount") ?? 0),
      },
      parseBudgetLineUpdates(formData),
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budgetId}`);
  revalidatePath("/portal");
  revalidatePath("/liquidador");
  return {
    success: "Cambios guardados correctamente.",
  };
}

export async function transitionBudgetStatusAction(
  budgetId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("transitionBudgetStatusAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await transitionBudgetStatus(
      budgetId,
      {
        nextStatus: String(formData.get("nextStatus") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budgetId}`);
  revalidatePath("/portal");
  revalidatePath("/liquidador");
  return {
    success: "Estado del presupuesto actualizado correctamente.",
  };
}

export async function createWorkOrderFromBudgetAction(
  budgetId: string,
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createWorkOrderFromBudgetAction", async () => {
    void previousState;
    void formData;
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    return createWorkOrderFromBudget(budgetId, session.user.id);
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budgetId}`);
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${result.data.id}`);
  revalidatePath("/portal");
  revalidatePath("/liquidador");
  revalidatePath(`/portal/budgets/${budgetId}`);
  await setFlashMessage({
    message: "Orden creada desde presupuesto aprobado.",
    tone: "success",
  });
  redirect(`/work-orders/${result.data.id}`);
}

