import { apiResponse, handleApiRoute } from "@/lib/http";
import { authorizePublicSelfInspectionAccess } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const POST = handleApiRoute(async (request: Request, { params }: RouteContext) => {
    const body = await request.json();
    const { token } = await params;
    const access = await authorizePublicSelfInspectionAccess(token, body);

    return apiResponse(access);
});