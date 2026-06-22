import { BillingDocumentType, PaymentStatus } from "@prisma/client";

export const BILLING_DOCUMENT_TYPE_LABELS: Record<BillingDocumentType, string> = {
  [BillingDocumentType.INVOICE]: "Factura",
  [BillingDocumentType.RECEIPT]: "Boleta",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Pendiente",
  [PaymentStatus.REPORTED]: "Reportado",
  [PaymentStatus.PAID]: "Pagado",
};
