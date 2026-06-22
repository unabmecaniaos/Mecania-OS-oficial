import { handleApiRoute } from "@/lib/http";
import { requireApiUser } from "@/modules/auth/auth.service";
import { buildBillingDocumentPdfForViewer } from "@/modules/billing/billing.service";

export const GET = handleApiRoute(async (...args) => {
  const [, context] = args as [Request, { params: Promise<Record<string, string>> }];
  const session = await requireApiUser();
  const { id } = await context.params;
  const { billingDocument, pdfBuffer } = await buildBillingDocumentPdfForViewer(id, session.user);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${billingDocument.pdfFileName}"`,
      "Cache-Control": "no-store",
    },
  });
});
