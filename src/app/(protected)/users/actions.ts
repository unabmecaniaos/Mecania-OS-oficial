"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { getErrorMessage } from "@/lib/errors";
import type { ActionState } from "@/lib/form-state";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  createManagedUser,
  deleteManagedUser,
  updateManagedUser,
} from "@/modules/users/user.service";

export async function createManagedUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireApiUser([UserRole.ADMIN]);

    await createManagedUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? ""),
      clientId: String(formData.get("clientId") ?? ""),
    });
  } catch (error) {
    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function updateManagedUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = String(formData.get("userId") ?? "");

  try {
    const session = await requireApiUser([UserRole.ADMIN]);

    await updateManagedUser(userId, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? ""),
      active:
        formData.get("active") === "on" || formData.get("activeLocked") === "true",
      password: String(formData.get("password") ?? ""),
      clientId: String(formData.get("clientId") ?? ""),
    }, session.user.id);
  } catch (error) {
    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function deleteManagedUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = String(formData.get("userId") ?? "");

  try {
    const session = await requireApiUser([UserRole.ADMIN]);

    await deleteManagedUser(userId, session.user.id);
  } catch (error) {
    return {
      error: getErrorMessage(error),
    };
  }

  revalidatePath("/users");
  redirect("/users");
}
