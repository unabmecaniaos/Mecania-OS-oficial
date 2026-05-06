import { apiResponse, handleApiRoute } from "@/lib/http";
import { getPublicSelfInspectionWizard } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const GET = handleApiRoute(async (_request: Request, { params }: RouteContext) => {
    const { token } = await params;
    const inspection = await getPublicSelfInspectionWizard(token);

    return apiResponse(inspection);
});