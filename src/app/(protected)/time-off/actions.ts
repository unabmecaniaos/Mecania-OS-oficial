"use server";

import { revalidatePath } from "next/cache";
import { UserRole, TimeOffRequestStatus } from "@prisma/client";
import { z } from "zod";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";

const TimeOffRequestSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inicial inválida"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha final inválida"),
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
}).refine(data => {
  const start = new Date(data.startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start >= today;
}, {
  message: "La fecha inicial no puede ser en el pasado",
  path: ["startDate"]
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "La fecha final no puede ser antes de la fecha inicial",
  path: ["endDate"]
});

export async function createTimeOffRequestAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = await executeServerAction("createTimeOffRequestAction", async () => {
    const session = await requireApiUser([UserRole.MECHANIC, UserRole.ADMIN]);
    
    const parsed = TimeOffRequestSchema.parse({
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      reason: formData.get("reason"),
    });

    return prisma.timeOffRequest.create({
      data: {
        userId: session.user.id,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        reason: parsed.reason,
        status: TimeOffRequestStatus.PENDING,
      }
    });
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/time-off");
  revalidatePath("/time-off/admin");
  
  await setFlashMessage({
    message: "Solicitud de vacaciones enviada correctamente.",
    tone: "success",
  });
  
  return { success: "Solicitud enviada." };
}

export async function updateTimeOffStatusAction(
  id: string,
  formData: FormData
) {
  const result = await executeServerAction("updateTimeOffStatusAction", async () => {
    await requireApiUser([UserRole.ADMIN]);
    
    const nextStatus = String(formData.get("nextStatus")) as TimeOffRequestStatus;
    
    if (nextStatus !== TimeOffRequestStatus.APPROVED && nextStatus !== TimeOffRequestStatus.REJECTED) {
      throw new Error("Estado inválido");
    }

    return prisma.timeOffRequest.update({
      where: { id },
      data: { status: nextStatus }
    });
  });

  if (!result.ok) {
    // Si falla, en Next.js App Router Server Actions puedes lanzar error o usar flash messages
    return;
  }

  revalidatePath("/time-off");
  revalidatePath("/time-off/admin");
}
