import { revalidatePath } from "next/cache";

export function revalidateApplicationData() {
  revalidatePath("/", "layout");
}
