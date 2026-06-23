import { PaymentReportSource, PaymentReportStatus } from "@prisma/client";

export const PAYMENT_REPORT_SOURCE_LABELS: Record<PaymentReportSource, string> = {
  [PaymentReportSource.CUSTOMER_PORTAL]: "Portal cliente",
  [PaymentReportSource.LIQUIDATOR_PORTAL]: "Portal liquidador",
};

export const PAYMENT_REPORT_STATUS_LABELS: Record<PaymentReportStatus, string> = {
  [PaymentReportStatus.REPORTED]: "Pendiente de validacion",
  [PaymentReportStatus.APPROVED]: "Validado",
};
