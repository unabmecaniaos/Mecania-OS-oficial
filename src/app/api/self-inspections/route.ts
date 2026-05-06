import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  createSelfInspectionInvite,
  listSelfInspections,
} from "@/modules/self-inspections/self-inspection.service";

export const GET = handleApiRoute(async (request: Request) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const inspections = await listSelfInspections({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      risk: searchParams.get("risk") ?? undefined,
    });

    return apiResponse(inspections);
});

export const POST = handleApiRoute(async (request: Request) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const body = await request.json();
    const invite = await createSelfInspectionInvite(body, session.user.id);

    return apiResponse(invite, 201);
});