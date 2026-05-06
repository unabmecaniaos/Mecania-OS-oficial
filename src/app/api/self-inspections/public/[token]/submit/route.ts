import { apiResponse, handleApiRoute } from "@/lib/http";
import { submitPublicSelfInspection } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const POST = handleApiRoute(async (request: Request, { params }: RouteContext) => {
    const body = await request.json();
    const { token } = await params;
    const inspection = await submitPublicSelfInspection(token, body);

    return apiResponse(inspection);
});