import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";

export const GET = handleApiRoute(async () => {
  const session = await requireApiUser();
  return apiResponse(session.user);
});
