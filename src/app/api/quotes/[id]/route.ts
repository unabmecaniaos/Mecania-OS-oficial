import { UserRole } from "@prisma/client";

import { apiError, apiResponse } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { getQuoteById } from "@/modules/quotes/quote.service";

type QuoteRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: QuoteRouteContext) {
  try {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { id } = await context.params;
    const quote = await getQuoteById(id);
    return apiResponse(quote);
  } catch (error) {
    return apiError(error);
  }
}
