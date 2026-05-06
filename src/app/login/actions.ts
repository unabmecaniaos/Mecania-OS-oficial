"use server";

import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { getDefaultRouteForRole, signIn } from "@/modules/auth/auth.service";

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination = "/dashboard";
  const result = await executeServerAction("loginAction", async () =>
    signIn({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    }),
  );

  if (!result.ok) {
    return result.state;
  }

  destination = getDefaultRouteForRole(result.data.role);
  redirect(destination);
}
