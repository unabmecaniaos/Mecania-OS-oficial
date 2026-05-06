"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createInternalUser, updateInternalUser } from "@/modules/users/user.service";

export async function createInternalUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createInternalUserAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await createInternalUser(
      {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/users");
  await setFlashMessage({
    message: "Usuario creado correctamente.",
    tone: "success",
  });
  redirect("/users");
}

export async function updateInternalUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = String(formData.get("userId") ?? "");
  const result = await executeServerAction("updateInternalUserAction", async () => {
    const session = await requireApiUser([UserRole.ADMIN]);

    await updateInternalUser(
      userId,
      {
        role: String(formData.get("role") ?? ""),
        active: formData.get("active") === "on",
        password: String(formData.get("password") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/users");
  await setFlashMessage({
    message: "Usuario actualizado correctamente.",
    tone: "success",
  });
  redirect("/users");
}
