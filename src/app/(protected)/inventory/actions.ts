"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  adjustStock,
  assignPartCompatibility,
  createRepuesto,
  registerStockEntry,
} from "@/modules/inventory/inventory.service";

export async function createRepuestoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createRepuestoAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await createRepuesto(
      {
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        unitPrice: String(formData.get("unitPrice") ?? ""),
        initialStock: String(formData.get("initialStock") ?? ""),
        minimumStock: String(formData.get("minimumStock") ?? ""),
        compatibleVehicleId: String(formData.get("compatibleVehicleId") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/inventory");
  await setFlashMessage({
    message: "Repuesto creado correctamente.",
    tone: "success",
  });
  redirect("/inventory");
}

export async function assignPartCompatibilityAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("assignPartCompatibilityAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await assignPartCompatibility(
      {
        repuestoId: String(formData.get("repuestoId") ?? ""),
        vehicleId: String(formData.get("vehicleId") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/compatibility");
  revalidatePath("/budgets/new");
  await setFlashMessage({
    message: "Compatibilidad de repuesto registrada correctamente.",
    tone: "success",
  });
  redirect("/inventory/compatibility");
}

export async function registerStockEntryAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("registerStockEntryAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await registerStockEntry(
      {
        repuestoId: String(formData.get("repuestoId") ?? ""),
        quantity: String(formData.get("quantity") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/inventory");
  await setFlashMessage({
    message: "Ingreso de stock registrado correctamente.",
    tone: "success",
  });
  redirect("/inventory");
}

export async function adjustStockAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("adjustStockAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await adjustStock(
      {
        repuestoId: String(formData.get("repuestoId") ?? ""),
        quantity: String(formData.get("quantity") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/inventory");
  await setFlashMessage({
    message: "Ajuste de stock guardado correctamente.",
    tone: "success",
  });
  redirect("/inventory");
}
