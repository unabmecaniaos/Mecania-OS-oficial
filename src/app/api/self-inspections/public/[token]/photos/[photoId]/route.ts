import { apiResponse, handleApiRoute } from "@/lib/http";
import { deletePublicSelfInspectionPhoto } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    token: string;
    photoId: string;
  }>;
};

export const DELETE = handleApiRoute(async (_request: Request, { params }: RouteContext) => {
    const { token, photoId } = await params;
    const inspection = await deletePublicSelfInspectionPhoto(token, photoId);

    return apiResponse(inspection);
});