import { QuoteItemType, QuoteRecipientType, QuoteStatus } from "@prisma/client";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: "Borrador",
  [QuoteStatus.SENT]: "Enviado",
  [QuoteStatus.APPROVED]: "Aprobado",
  [QuoteStatus.REJECTED]: "Rechazado",
};

export const QUOTE_RECIPIENT_LABELS: Record<QuoteRecipientType, string> = {
  [QuoteRecipientType.CUSTOMER]: "Cliente",
  [QuoteRecipientType.INSURER]: "Aseguradora",
};

export const QUOTE_ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  [QuoteItemType.LABOR]: "Mano de obra",
  [QuoteItemType.PART]: "Repuesto",
  [QuoteItemType.SUPPLY]: "Suministro",
};

export const QUOTE_STATUS_OPTIONS = Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const QUOTE_RECIPIENT_OPTIONS = Object.entries(QUOTE_RECIPIENT_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const QUOTE_ITEM_TYPE_OPTIONS = Object.entries(QUOTE_ITEM_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
