"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BudgetItemType, UserRole } from "@prisma/client";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  createWorkOrderFromBudget,
  createLiquidatorBudgetDraft,
  createWorkshopBudgetDraft,
  transitionBudgetStatus,
  updateBudgetDraft,
} from "@/modules/budgets/budget.service";

function parseCatalogSelections(formData: FormData) {
  const partGrouped = new Map<
    string,
    {
      itemId?: string;
      quantity?: number;
    }
  >();
  const referenceGrouped = new Map<
    string,
    {
      itemType?: BudgetItemType;
      itemId?: string;
      quantity?: number;
    }
  >();

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue).trim();

    if (key.startsWith("partItem:")) {
      const slot = key.replace("partItem:", "");
      partGrouped.set(slot, {
        ...partGrouped.get(slot),
        itemId: value,
      });
      continue;
    }

    if (key.startsWith("partQuantity:")) {
      const slot = key.replace("partQuantity:", "");
      partGrouped.set(slot, {
        ...partGrouped.get(slot),
        quantity: Number(value),
      });
      continue;
    }

    if (key.startsWith("referenceItem:")) {
      const [, rawType, slot] = key.split(":");
      if (!Object.values(BudgetItemType).includes(rawType as BudgetItemType)) {
        continue;
      }

      referenceGrouped.set(`${rawType}:${slot}`, {
        ...referenceGrouped.get(`${rawType}:${slot}`),
        itemType: rawType as BudgetItemType,
        itemId: value,
      });
      continue;
    }

    if (key.startsWith("referenceQuantity:")) {
      const [, rawType, slot] = key.split(":");
      if (!Object.values(BudgetItemType).includes(rawType as BudgetItemType)) {
        continue;
      }

      referenceGrouped.set(`${rawType}:${slot}`, {
        ...referenceGrouped.get(`${rawType}:${slot}`),
        itemType: rawType as BudgetItemType,
        quantity: Number(value),
      });
    }
  }

  return [
    ...Array.from(partGrouped.values()).flatMap((entry) => {
      const itemId = entry.itemId?.trim() ?? "";
      const quantity = entry.quantity ?? 0;

      if (!itemId || !Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      return [
        {
          source: "inventoryPart" as const,
          itemType: BudgetItemType.PART,
          itemId,
          quantity,
        },
      ];
    }),
    ...Array.from(referenceGrouped.values()).flatMap((entry) => {
      const itemId = entry.itemId?.trim() ?? "";
      const quantity = entry.quantity ?? 0;

      if (!entry.itemType || !itemId || !Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      return [
        {
          source: "referenceCatalog" as const,
          itemType: entry.itemType,
          itemId,
          quantity,
        },
      ];
    }),
  ];
}

function parseManualSelections(formData: FormData) {
  type DraftManualSelectionInput = {
    itemType: BudgetItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    note: string | undefined;
  };

  const grouped = new Map<
    string,
    {
      itemType?: BudgetItemType;
      description?: string;
      quantity?: number;
      unitPrice?: number;
      note?: string;
    }
  >();

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue);

    if (key.startsWith("manualDescription:")) {
      const [, rawType, slot] = key.split(":");
      if (!Object.values(BudgetItemType).includes(rawType as BudgetItemType)) {
        continue;
      }
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        itemType: rawType as BudgetItemType,
        description: value,
      });
    }

    if (key.startsWith("manualQuantity:")) {
      const [, rawType, slot] = key.split(":");
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        quantity: Number(value),
      });
    }

    if (key.startsWith("manualPrice:")) {
      const [, rawType, slot] = key.split(":");
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        unitPrice: Number(value),
      });
    }

    if (key.startsWith("manualNote:")) {
      const [, rawType, slot] = key.split(":");
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        note: value,
      });
    }
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      itemType: entry.itemType,
      description: entry.description?.trim() ?? "",
      quantity: entry.quantity ?? 0,
      unitPrice: entry.unitPrice ?? 0,
      note: entry.note?.trim() || undefined,
    }))
    .filter(
      (entry): entry is DraftManualSelectionInput =>
        Boolean(entry.itemType) &&
        entry.description.length > 0 &&
        Number.isFinite(entry.quantity) &&
        entry.quantity > 0 &&
        Number.isFinite(entry.unitPrice) &&
        entry.unitPrice >= 0,
    );
}

function parseLineUpdates(formData: FormData) {
  const grouped = new Map<
    string,
    {
      quantity?: number;
      unitPrice?: number;
      note?: string;
    }
  >();

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue);

    if (key.startsWith("lineQty:")) {
      const id = key.replace("lineQty:", "");
      grouped.set(id, {
        ...grouped.get(id),
        quantity: Number(value),
      });
    }

    if (key.startsWith("linePrice:")) {
      const id = key.replace("linePrice:", "");
      grouped.set(id, {
        ...grouped.get(id),
        unitPrice: Number(value),
      });
    }

    if (key.startsWith("lineNote:")) {
      const id = key.replace("lineNote:", "");
      grouped.set(id, {
        ...grouped.get(id),
        note: value,
      });
    }
  }

  return Array.from(grouped.entries()).map(([id, entry]) => ({
    id,
    quantity: entry.quantity ?? 1,
    unitPrice: entry.unitPrice ?? 0,
    note: entry.note,
  }));
}

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
      },
      parseCatalogSelections(formData),
      parseManualSelections(formData),
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
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC, UserRole.LIQUIDATOR]);

    return createLiquidatorBudgetDraft(
      {
        insuranceCaseId: String(formData.get("insuranceCaseId") ?? ""),
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
      },
      parseCatalogSelections(formData),
      parseManualSelections(formData),
      {
        id: session.user.id,
        role: session.user.role,
      },
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

  if (result.data.insuranceCaseId && result.data.insuranceCase?.liquidatorId === result.data.createdById) {
    redirect(`/liquidador/cases/${result.data.insuranceCaseId}`);
  }

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
      },
      parseLineUpdates(formData),
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
