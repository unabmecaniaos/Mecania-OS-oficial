import { NextResponse } from "next/server";

import { handleApiRoute } from "@/lib/http";
import { getInsuranceCasePhotoFile } from "@/modules/insurance-cases/insurance-case.service";

type InsuranceCasePhotoRouteContext = {
  params: Promise<{
    photoId: string;
  }>;
};

export const GET = handleApiRoute(
  async (_request: Request, context: InsuranceCasePhotoRouteContext) => {
    const { photoId } = await context.params;
    const photo = await getInsuranceCasePhotoFile(photoId);

    return new NextResponse(photo.body, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="${photo.fileName.replace(/"/g, "")}"`,
        "Content-Type": photo.mimeType,
      },
    });
  },
);
