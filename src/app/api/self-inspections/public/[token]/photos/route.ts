import { apiResponse, handleApiRoute } from "@/lib/http";
import { uploadPublicSelfInspectionPhoto } from "@/modules/self-inspections/self-inspection.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const POST = handleApiRoute(async (request: Request, { params }: RouteContext) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Debes adjuntar una imagen");
    }

    const { token } = await params;
    const inspection = await uploadPublicSelfInspectionPhoto(token, file, {
      photoType: String(formData.get("photoType") ?? ""),
      comment: String(formData.get("comment") ?? ""),
      sortOrder: String(formData.get("sortOrder") ?? "0"),
    });

    return apiResponse(inspection);
});