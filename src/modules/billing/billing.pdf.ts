import type { BillingDocumentType } from "@prisma/client";

import { formatCurrency, formatDateTime } from "@/lib/utils";
import { BILLING_DOCUMENT_TYPE_LABELS } from "@/modules/billing/billing.constants";

type BuildBillingDocumentPdfInput = {
  type: BillingDocumentType;
  folio: string;
  issuedAt: Date;
  orderNumber: string;
  budgetNumber: string;
  customerName: string;
  customerTaxId: string;
  customerBusinessName: string;
  vehicleLabel: string;
  subtotalParts: number;
  subtotalLabor: number;
  subtotalSupplies: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string | null;
};

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function wrapText(value: string, maxLength = 82) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildPdfBody(lines: string[]) {
  const commands = ["BT", "/F1 11 Tf"];
  let y = 800;

  for (const line of lines) {
    commands.push(`1 0 0 1 54 ${y} Tm (${escapePdfText(line)}) Tj`);
    y -= 16;
  }

  commands.push("ET");
  return commands.join("\n");
}

function composePdf(objects: string[]) {
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export function buildBillingDocumentPdf(input: BuildBillingDocumentPdfInput) {
  const lines = [
    `MecaniaOS - ${BILLING_DOCUMENT_TYPE_LABELS[input.type]}`,
    `Folio: ${input.folio}`,
    `Emitido: ${formatDateTime(input.issuedAt)}`,
    "",
    `Orden de trabajo: ${input.orderNumber}`,
    `Presupuesto origen: ${input.budgetNumber}`,
    `Cliente: ${input.customerName}`,
    `RUT / ID tributario: ${input.customerTaxId}`,
    `Razon social / nombre: ${input.customerBusinessName}`,
    `Vehiculo: ${input.vehicleLabel}`,
    "",
    `Base repuestos: ${formatCurrency(input.subtotalParts)}`,
    `Base mano de obra: ${formatCurrency(input.subtotalLabor)}`,
    `Suministros: ${formatCurrency(input.subtotalSupplies)}`,
    `Monto neto: ${formatCurrency(input.netAmount)}`,
    `IVA (19% sobre repuestos + mano de obra): ${formatCurrency(input.vatAmount)}`,
    `Total final: ${formatCurrency(input.totalAmount)}`,
    "",
  ];

  if (input.notes?.trim()) {
    lines.push("Observaciones:");
    lines.push(...wrapText(input.notes.trim()));
    lines.push("");
  }

  lines.push(
    "Documento generado desde el modulo de facturacion de MecaniaOS.",
    "Este PDF resume el documento de cobro asociado a la orden y su presupuesto aprobado.",
  );

  const body = buildPdfBody(lines);
  const stream = `<< /Length ${Buffer.byteLength(body, "utf8")} >>\nstream\n${body}\nendstream`;

  return composePdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    stream,
  ]);
}
