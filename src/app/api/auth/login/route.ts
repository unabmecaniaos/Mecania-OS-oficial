import { apiResponse, handleApiRoute } from "@/lib/http";
import { signIn } from "@/modules/auth/auth.service";

export const POST = handleApiRoute(async (request: Request) => {
    const body = await request.json();
    const user = await signIn(body);
    return apiResponse(user, 200);
});