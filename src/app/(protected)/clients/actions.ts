"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { createClient } from "@/modules/clients/client.service";
import { requireApiUser } from "@/modules/auth/auth.service";

export async function createClientAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createClientAction", async () => {
    const session = await requireApiUser();

    await createClient(
      {
        fullName: String(formData.get("fullName") ?? ""),
        localIdentifier: String(formData.get("localIdentifier") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        address: String(formData.get("address") ?? ""),
        portalPassword: String(formData.get("portalPassword") ?? ""),
      },
      session.user.id,
    );
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/clients");
  await setFlashMessage({
    message: "Cliente creado correctamente.",
    tone: "success",
  });
  redirect("/clients");
}
