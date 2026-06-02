import { apiResponse, handleApiRoute } from "@/lib/http";
import { checkPublicSelfInspectionEmailAvailability } from "@/modules/self-inspections/self-inspection.service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const GET = handleApiRoute(async (request: Request, { params }: RouteContext) => {
  const { token } = await params;
  const email = new URL(request.url).searchParams.get("email");
  const availability = await checkPublicSelfInspectionEmailAvailability(token, email);

  return apiResponse(availability);
});
