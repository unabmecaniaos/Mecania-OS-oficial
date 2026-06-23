import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  BudgetStatus,
  PaymentReportSource,
  PaymentReportStatus,
  PaymentStatus,
} from "@prisma/client";

import { env } from "@/lib/env";
import { AppError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  isPublicStorageEnabled,
  uploadPublicStorageObject,
} from "@/lib/supabase-storage";

const paymentLogger = createLogger("payments");

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const mimeExtensionMap: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const REPORTABLE_BUDGET_STATUSES = new Set<BudgetStatus>([
  BudgetStatus.APPROVED,
  BudgetStatus.PARTIALLY_APPROVED,
  BudgetStatus.CONVERTED_TO_WORK_ORDER,
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function resolveFileExtension(fileName: string, mimeType: string) {
  const explicitExtension = path.extname(fileName);

  if (explicitExtension) {
    return explicitExtension.toLowerCase();
  }

  return mimeExtensionMap[mimeType] ?? ".bin";
}

function normalizeOptionalText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function validateProofFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new AppError("Formato no permitido. Usa PDF, JPG, PNG o WEBP.", 422);
  }

  if (file.size <= 0) {
    throw new AppError("El archivo enviado esta vacio.", 422);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError("El comprobante supera el tamano maximo de 8 MB.", 422);
  }
}

export function isPaymentProofStorageConfigured() {
  return isPublicStorageEnabled(env.SUPABASE_STORAGE_BUCKET_WORK_ORDERS);
}

async function savePaymentProofFile(input: { workOrderId: string; file: File }) {
  validateProofFile(input.file);

  if (!isPaymentProofStorageConfigured()) {
    throw new AppError(
      "La carga de comprobantes no esta habilitada todavia en este entorno.",
      500,
    );
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET_WORK_ORDERS as string;
  const extension = resolveFileExtension(input.file.name, input.file.type);
  const safeOriginalName = sanitizeFileName(
    path.basename(input.file.name, path.extname(input.file.name)) || "payment-proof",
  );
  const finalFileName = `payment-proof-${safeOriginalName}-${randomUUID()}${extension}`;
  const storageKey = path.posix.join(input.workOrderId, "payment-proofs", finalFileName);

  return uploadPublicStorageObject({
    bucket,
    storageKey,
    file: input.file,
  });
}

async function getCustomerBudgetPaymentContext(budgetId: string, customerId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      clientId: customerId,
      deletedAt: null,
    },
    include: {
      workOrder: true,
    },
  });

  if (!budget) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  if (!budget.workOrder) {
    throw new AppError("El presupuesto aun no tiene una orden asociada para registrar el pago.", 422);
  }

  if (!REPORTABLE_BUDGET_STATUSES.has(budget.status)) {
    throw new AppError("El presupuesto aun no esta listo para registrar el pago.", 422);
  }

  return budget as typeof budget & { workOrder: NonNullable<typeof budget.workOrder> };
}

async function getLiquidatorBudgetPaymentContext(budgetId: string, liquidatorId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      deletedAt: null,
      insuranceCase: {
        liquidatorId,
      },
    },
    include: {
      insuranceCase: {
        select: {
          id: true,
          liquidatorId: true,
        },
      },
      workOrder: true,
    },
  });

  if (!budget) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  if (!budget.insuranceCase || budget.insuranceCase.liquidatorId !== liquidatorId) {
    throw new UnauthorizedError("No puedes reportar pagos sobre este presupuesto");
  }

  if (!budget.workOrder) {
    throw new AppError("El presupuesto aun no tiene una orden asociada para recibir el reporte.", 422);
  }

  if (!REPORTABLE_BUDGET_STATUSES.has(budget.status)) {
    throw new AppError("Solo puedes reportar pagos sobre presupuestos aprobados.", 422);
  }

  return budget as typeof budget & {
    insuranceCase: NonNullable<typeof budget.insuranceCase>;
    workOrder: NonNullable<typeof budget.workOrder>;
  };
}

export async function confirmCustomerPortalMockPayment(
  budgetId: string,
  input: { paymentReference?: string; note?: string },
  actorId: string,
  customerId: string,
) {
  const budget = await getCustomerBudgetPaymentContext(budgetId, customerId);
  const changedAt = new Date();
  const paymentReference =
    normalizeOptionalText(input.paymentReference) ?? `PORTAL-${budget.workOrder.orderNumber}`;
  const note = normalizeOptionalText(input.note) ?? "Pago simulado confirmado desde el portal cliente.";

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: budget.workOrder.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: budget.workOrder.paidAt ?? changedAt,
        paymentReference,
        updatedById: actorId,
      },
    });

    await tx.budget.update({
      where: { id: budget.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: budget.paidAt ?? changedAt,
        paymentReference,
        updatedById: actorId,
      },
    });

    await tx.paymentReport.create({
      data: {
        budgetId: budget.id,
        workOrderId: budget.workOrder.id,
        reportedById: actorId,
        approvedById: actorId,
        source: PaymentReportSource.CUSTOMER_PORTAL,
        status: PaymentReportStatus.APPROVED,
        paymentReference,
        note,
        approvedAt: changedAt,
      },
    });
  });

  paymentLogger.info("Customer portal mock payment confirmed", {
    actorId,
    budgetId: budget.id,
    workOrderId: budget.workOrder.id,
    paymentReference,
  });
}

export async function reportLiquidatorBudgetPayment(
  budgetId: string,
  input: { file: File; paymentReference?: string; note?: string },
  actorId: string,
) {
  const budget = await getLiquidatorBudgetPaymentContext(budgetId, actorId);

  if (budget.workOrder.paymentStatus === PaymentStatus.PAID || budget.paymentStatus === PaymentStatus.PAID) {
    throw new AppError("La orden ya figura como pagada, por lo que no admite un nuevo reporte.", 409);
  }

  const savedFile = await savePaymentProofFile({
    workOrderId: budget.workOrder.id,
    file: input.file,
  });
  const paymentReference = normalizeOptionalText(input.paymentReference);
  const note = normalizeOptionalText(input.note);

  const report = await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: budget.workOrder.id },
      data: {
        paymentStatus: PaymentStatus.REPORTED,
        paymentReference,
        updatedById: actorId,
      },
    });

    await tx.budget.update({
      where: { id: budget.id },
      data: {
        paymentStatus: PaymentStatus.REPORTED,
        paymentReference,
        updatedById: actorId,
      },
    });

    return tx.paymentReport.create({
      data: {
        budgetId: budget.id,
        workOrderId: budget.workOrder.id,
        reportedById: actorId,
        source: PaymentReportSource.LIQUIDATOR_PORTAL,
        status: PaymentReportStatus.REPORTED,
        paymentReference,
        note,
        fileUrl: savedFile.fileUrl,
        storageKey: savedFile.storageKey,
        fileName: savedFile.fileName,
        mimeType: savedFile.mimeType,
        sizeBytes: savedFile.sizeBytes,
      },
    });
  });

  paymentLogger.info("Liquidator payment reported", {
    actorId,
    budgetId: budget.id,
    workOrderId: budget.workOrder.id,
    paymentReportId: report.id,
  });

  return report;
}

export async function approvePaymentReport(
  reportId: string,
  input: { paymentReference?: string },
  actorId: string,
) {
  const report = await prisma.paymentReport.findFirst({
    where: {
      id: reportId,
    },
    include: {
      budget: true,
      workOrder: true,
    },
  });

  if (!report) {
    throw new NotFoundError("Reporte de pago no encontrado");
  }

  const changedAt = new Date();
  const paymentReference =
    normalizeOptionalText(input.paymentReference) ?? report.paymentReference ?? report.workOrder.paymentReference ?? undefined;

  await prisma.$transaction(async (tx) => {
    await tx.paymentReport.update({
      where: { id: report.id },
      data: {
        status: PaymentReportStatus.APPROVED,
        approvedById: actorId,
        approvedAt: report.approvedAt ?? changedAt,
        paymentReference,
      },
    });

    await tx.workOrder.update({
      where: { id: report.workOrderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: report.workOrder.paidAt ?? changedAt,
        paymentReference,
        updatedById: actorId,
      },
    });

    await tx.budget.update({
      where: { id: report.budgetId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: report.budget.paidAt ?? changedAt,
        paymentReference,
        updatedById: actorId,
      },
    });
  });

  paymentLogger.info("Payment report approved", {
    actorId,
    paymentReportId: report.id,
    budgetId: report.budgetId,
    workOrderId: report.workOrderId,
  });
}

