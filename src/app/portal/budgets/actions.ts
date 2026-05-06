"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { BudgetStatus } from "@prisma/client";

import { getErrorMessage } from "@/lib/errors";
import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { revalidateApplicationData } from "@/lib/revalidation";
import { respondToCustomerBudget } from "@/modules/customer-portal/customer-portal.service";

export async function respondToCustomerBudgetAction(
  budgetId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const nextStatus = String(formData.get("nextStatus") ?? "");

    if (nextStatus !== BudgetStatus.APPROVED && nextStatus !== BudgetStatus.REJECTED) {
      return {
        error: "La respuesta solicitada no es valida.",
      };
    }

    await respondToCustomerBudget(budgetId, {
      nextStatus,
      note: String(formData.get("note") ?? ""),
    });

    revalidateApplicationData();
    revalidatePath("/portal");
    revalidatePath(`/portal/budgets/${budgetId}`);
    revalidatePath("/budgets");
    revalidatePath(`/budgets/${budgetId}`);
    await setFlashMessage({
      message:
        nextStatus === BudgetStatus.APPROVED
          ? "Presupuesto aprobado correctamente."
          : "Presupuesto rechazado correctamente.",
      tone: "success",
    });
    return {
      success:
        nextStatus === BudgetStatus.APPROVED
          ? "Presupuesto aprobado correctamente."
          : "Presupuesto rechazado correctamente.",
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }
}
