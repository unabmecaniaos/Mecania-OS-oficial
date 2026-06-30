"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { UserRole, PaymentConcept } from "@prisma/client";

import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";

const MechanicPaymentSchema = z.object({
  mechanicId: z.string().min(1, "Debe seleccionar un mecánico"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  concept: z.nativeEnum(PaymentConcept),
  note: z.string().optional(),
});

export async function createMechanicPaymentAction(formData: FormData) {
  const result = await executeServerAction("createMechanicPaymentAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    const parsed = MechanicPaymentSchema.parse({
      mechanicId: formData.get("mechanicId"),
      amount: formData.get("amount"),
      paymentDate: formData.get("paymentDate"),
      concept: formData.get("concept"),
      note: formData.get("note"),
    });

    const payment = await prisma.mechanicPayment.create({
      data: {
        mechanicId: parsed.mechanicId,
        adminId: session.user.id,
        amount: parsed.amount,
        paymentDate: new Date(parsed.paymentDate),
        concept: parsed.concept,
        note: parsed.note || null,
      },
    });

    return payment;
  });

  if (!result.ok) {
    return { success: false, error: result.state?.error || "Error al registrar el pago" };
  }

  revalidatePath("/payroll");
  revalidatePath(`/performance/${result.data.mechanicId}`);

  return { success: true };
}
