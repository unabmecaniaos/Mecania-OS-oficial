import { apiResponse, handleApiRoute } from "@/lib/http";
import { savePublicSelfInspectionVehicle } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const PUT = handleApiRoute(async (request: Request, { params }: RouteContext) => {
    const body = await request.json();
    const { token } = await params;
    const inspection = await savePublicSelfInspectionVehicle(token, body);

    return apiResponse(inspection);
});