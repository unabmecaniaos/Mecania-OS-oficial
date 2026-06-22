import { BillingDocumentType } from "@prisma/client";
import { z } from "zod";

export const markWorkOrderPaidSchema = z.object({
  paymentReference: z.string().trim().max(80).optional(),
});

export const createBillingDocumentSchema = z.object({
  type: z.nativeEnum(BillingDocumentType),
  folio: z.string().trim().min(1, "Debes ingresar el folio del documento").max(40),
  customerTaxId: z.string().trim().min(1, "Debes ingresar el RUT o identificador tributario").max(32),
  customerBusinessName: z.string().trim().min(1, "Debes ingresar la razon social o nombre").max(160),
  notes: z.string().trim().max(500).optional(),
});
