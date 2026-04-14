import { UserRole } from "@prisma/client";

import { apiError, apiResponse } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { rejectQuote } from "@/modules/quotes/quote.service";

type QuoteRejectRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: QuoteRejectRouteContext) {
  try {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const body = await request.json();
    const quote = await rejectQuote(id, body, session.user.id);
    return apiResponse(quote);
  } catch (error) {
    return apiError(error);
  }
}
