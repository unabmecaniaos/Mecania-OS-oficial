import { apiResponse, handleApiRoute } from "@/lib/http";
import { signOut } from "@/modules/auth/auth.service";

export const POST = handleApiRoute(async () => {
  await signOut();
  return apiResponse({ ok: true });
});
