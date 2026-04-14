import { QuoteStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS_LABELS } from "@/modules/quotes/quote.constants";

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const tone =
    status === QuoteStatus.APPROVED
      ? "success"
      : status === QuoteStatus.SENT
        ? "warning"
        : status === QuoteStatus.DRAFT
          ? "info"
          : "neutral";

  return <Badge tone={tone}>{QUOTE_STATUS_LABELS[status]}</Badge>;
}
