import { QuoteRecipientType, QuoteStatus, UserRole } from "@prisma/client";

import { apiError, apiResponse } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createQuote, listQuotes } from "@/modules/quotes/quote.service";

export async function GET(request: Request) {
  try {
    await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const recipientParam = searchParams.get("recipient");
    const quotes = await listQuotes({
      q: searchParams.get("q") ?? undefined,
      status:
        statusParam && statusParam in QuoteStatus ? (statusParam as QuoteStatus) : undefined,
      recipient:
        recipientParam && recipientParam in QuoteRecipientType
          ? (recipientParam as QuoteRecipientType)
          : undefined,
    });

    return apiResponse(quotes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const body = await request.json();
    const quote = await createQuote(body, session.user.id);
    return apiResponse(quote, 201);
  } catch (error) {
    return apiError(error);
  }
}
