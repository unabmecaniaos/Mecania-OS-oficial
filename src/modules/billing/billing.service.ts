import { BillingDocumentType, PaymentStatus, UserRole } from "@prisma/client";

import { AppError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { buildBillingDocumentPdf } from "@/modules/billing/billing.pdf";
import { createBillingDocumentSchema, markWorkOrderPaidSchema } from "@/modules/billing/billing.schemas";

const billingLogger = createLogger("billing");

type Viewer = {
  id: string;
  role: UserRole;
  clientId?: string | null;
};

type BillingWorkOrderContext = Awaited<ReturnType<typeof getWorkOrderBillingContext>>;

function calculateBillingTotals(budget: { subtotalParts: number; subtotalLabor: number; subtotalSupplies: number }) {
  const taxableBase = budget.subtotalParts + budget.subtotalLabor;
  const netAmount = taxableBase + budget.subtotalSupplies;
  const vatAmount = Math.round(taxableBase * 0.19);
  const totalAmount = netAmount + vatAmount;

  return { taxableBase, netAmount, vatAmount, totalAmount };
}

async function getWorkOrderBillingContext(workOrderId: string) {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, deletedAt: null },
    include: {
      client: true,
      vehicle: true,
      budget: {
        include: {
          billingDocuments: {
            orderBy: { issuedAt: "desc" },
          },
        },
      },
      billingDocuments: {
        orderBy: { issuedAt: "desc" },
      },
    },
  });

  if (!workOrder) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  if (!workOrder.budget) {
    throw new AppError("La orden debe provenir de un presupuesto para registrar cobro o facturacion", 422);
  }

  return workOrder as typeof workOrder & { budget: NonNullable<typeof workOrder.budget> };
}

export async function markWorkOrderAsPaid(workOrderId: string, input: unknown, actorId: string) {
  const data = markWorkOrderPaidSchema.parse(input);
  const workOrder: BillingWorkOrderContext = await getWorkOrderBillingContext(workOrderId);
  const budget = workOrder.budget;

  if (workOrder.paymentStatus === PaymentStatus.PAID && budget.paymentStatus === PaymentStatus.PAID) {
    return workOrder;
  }

  const changedAt = new Date();
  const paymentReference = data.paymentReference?.trim() || undefined;

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: workOrder.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: workOrder.paidAt ?? changedAt,
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
  });

  billingLogger.info("Work order marked as paid", {
    actorId,
    workOrderId: workOrder.id,
    budgetId: budget.id,
    paymentReference,
  });

  return getWorkOrderBillingContext(workOrderId);
}

export async function createBillingDocument(workOrderId: string, input: unknown, actorId: string) {
  const data = createBillingDocumentSchema.parse(input);
  const workOrder: BillingWorkOrderContext = await getWorkOrderBillingContext(workOrderId);
  const budget = workOrder.budget;

  if (workOrder.paymentStatus !== PaymentStatus.PAID || budget.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError("Solo puedes generar factura o boleta cuando la orden y el presupuesto ya estan pagados", 422);
  }

  const duplicate = workOrder.billingDocuments.find((document) => document.type === data.type);
  if (duplicate) {
    throw new AppError("Ya existe un documento de este tipo para la orden", 409);
  }

  const totals = calculateBillingTotals(budget);
  const filePrefix = data.type === BillingDocumentType.INVOICE ? "factura" : "boleta";
  const pdfFileName = `${filePrefix}-${workOrder.orderNumber.toLowerCase()}-${data.folio}.pdf`;

  const billingDocument = await prisma.billingDocument.create({
    data: {
      budgetId: budget.id,
      workOrderId: workOrder.id,
      createdById: actorId,
      type: data.type,
      folio: data.folio.trim(),
      customerTaxId: data.customerTaxId.trim(),
      customerBusinessName: data.customerBusinessName.trim(),
      notes: data.notes?.trim() || null,
      netAmount: totals.netAmount,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      pdfFileName,
    },
  });

  billingLogger.info("Billing document created", {
    actorId,
    workOrderId: workOrder.id,
    budgetId: budget.id,
    billingDocumentId: billingDocument.id,
    type: billingDocument.type,
    folio: billingDocument.folio,
  });

  return billingDocument;
}

async function getBillingDocumentRecord(documentId: string) {
  const billingDocument = await prisma.billingDocument.findFirst({
    where: { id: documentId },
    include: {
      createdBy: { select: { id: true, name: true } },
      budget: {
        include: {
          client: true,
          vehicle: true,
          insuranceCase: { select: { id: true, liquidatorId: true } },
        },
      },
      workOrder: { select: { id: true, orderNumber: true } },
    },
  });

  if (!billingDocument) {
    throw new NotFoundError("Documento de cobro no encontrado");
  }

  return billingDocument;
}

function assertBillingDocumentAccess(billingDocument: Awaited<ReturnType<typeof getBillingDocumentRecord>>, viewer: Viewer) {
  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.MECHANIC) {
    return;
  }

  if (viewer.role === UserRole.CUSTOMER) {
    if (!viewer.clientId || billingDocument.budget.clientId !== viewer.clientId) {
      throw new UnauthorizedError("No tienes acceso a este documento");
    }
    return;
  }

  if (viewer.role === UserRole.LIQUIDATOR) {
    if (billingDocument.budget.insuranceCase?.liquidatorId !== viewer.id) {
      throw new UnauthorizedError("No tienes acceso a este documento");
    }
    return;
  }

  throw new UnauthorizedError("No tienes acceso a este documento");
}

export async function getBillingDocumentForViewer(documentId: string, viewer: Viewer) {
  const billingDocument = await getBillingDocumentRecord(documentId);
  assertBillingDocumentAccess(billingDocument, viewer);
  return billingDocument;
}

export async function buildBillingDocumentPdfForViewer(documentId: string, viewer: Viewer) {
  const billingDocument = await getBillingDocumentForViewer(documentId, viewer);
  const budget = billingDocument.budget;

  const pdfBuffer = buildBillingDocumentPdf({
    type: billingDocument.type,
    folio: billingDocument.folio,
    issuedAt: billingDocument.issuedAt,
    orderNumber: billingDocument.workOrder.orderNumber,
    budgetNumber: budget.budgetNumber,
    customerName: budget.client.fullName,
    customerTaxId: billingDocument.customerTaxId,
    customerBusinessName: billingDocument.customerBusinessName,
    vehicleLabel: `${budget.vehicle.make} ${budget.vehicle.model} / ${budget.vehicle.plate ?? budget.vehicle.vin}`,
    subtotalParts: budget.subtotalParts,
    subtotalLabor: budget.subtotalLabor,
    subtotalSupplies: budget.subtotalSupplies,
    netAmount: billingDocument.netAmount,
    vatAmount: billingDocument.vatAmount,
    totalAmount: billingDocument.totalAmount,
    notes: billingDocument.notes,
  });

  return { billingDocument, pdfBuffer };
}

export function getBillingTotalsFromBudget(budget: { subtotalParts: number; subtotalLabor: number; subtotalSupplies: number }) {
  return calculateBillingTotals(budget);
}
