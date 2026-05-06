"use server";

import { redirect } from "next/navigation";

import { revalidateApplicationData } from "@/lib/revalidation";
import { signOut } from "@/modules/auth/auth.service";

export async function logoutAction() {
  await signOut();
  revalidateApplicationData();
  redirect("/login");
}
