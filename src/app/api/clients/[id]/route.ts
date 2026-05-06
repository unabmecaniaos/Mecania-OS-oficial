import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getClientById, updateClient } from "@/modules/clients/client.service";

type ClientRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = handleApiRoute(async (_request: Request, context: ClientRouteContext) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const client = await getClientById(id);
    return apiResponse(client);
});

export const PATCH = handleApiRoute(async (request: Request, context: ClientRouteContext) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const body = await request.json();
    const client = await updateClient(id, body, session.user.id);
    return apiResponse(client);
});