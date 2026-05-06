import { UserRole } from "@prisma/client";

import { apiResponse, handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createClient, listClients } from "@/modules/clients/client.service";

export const GET = handleApiRoute(async (request: Request) => {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const clients = await listClients(searchParams.get("q") ?? undefined);
    return apiResponse(clients);
});

export const POST = handleApiRoute(async (request: Request) => {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const body = await request.json();
    const client = await createClient(body, session.user.id);
    return apiResponse(client, 201);
});