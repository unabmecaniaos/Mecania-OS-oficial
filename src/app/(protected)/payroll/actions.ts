"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createMechanicPayment } from "@/modules/payroll/payroll.service";

export async function createMechanicPaymentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createMechanicPaymentAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await createMechanicPayment(
      {
        mechanicId: String(formData.get("mechanicId") ?? ""),
        concept: String(formData.get("concept") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        paidAt: String(formData.get("paidAt") ?? ""),
        note: String(formData.get("note") ?? ""),
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

  revalidatePath("/payroll");
  revalidatePath("/users");
  return {
    success: "Pago registrado correctamente.",
  };
}
