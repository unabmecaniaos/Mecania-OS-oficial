import { Prisma, QuoteStatus } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { QUOTE_RECIPIENT_LABELS } from "@/modules/quotes/quote.constants";
import { quoteRepository } from "@/modules/quotes/quote.repository";
import {
  createQuoteSchema,
  listQuoteFiltersSchema,
  transitionQuoteSchema,
} from "@/modules/quotes/quote.schemas";

async function assertClientVehicleMatch(clientId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      clientId: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado");
  }

  if (vehicle.clientId !== clientId) {
    throw new ConflictError("El vehiculo no pertenece al cliente seleccionado");
  }
}

async function getNextQuoteNumber() {
  const year = new Date().getFullYear();
  const prefix = `PTO-${year}-`;
  const lastQuote = await quoteRepository.findLastQuoteNumberForYear(prefix);
  const nextSequence = lastQuote ? Number(lastQuote.quoteNumber.slice(-4)) + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function resolveQuoteAssociation(data: ReturnType<typeof createQuoteSchema.parse>) {
  if (data.selfInspectionId) {
    const inspection = await quoteRepository.findReviewedSelfInspectionById(data.selfInspectionId);

    if (!inspection || !inspection.vehicleId) {
      throw new ConflictError(
        "Solo puedes asociar una autoinspeccion revisada que tenga cliente y vehiculo materializados",
      );
    }

    if (data.clientId && data.clientId !== inspection.customerId) {
      throw new ConflictError("La autoinspeccion revisada no pertenece al cliente seleccionado");
    }

    if (data.vehicleId && data.vehicleId !== inspection.vehicleId) {
      throw new ConflictError("La autoinspeccion revisada no corresponde al vehiculo seleccionado");
    }

    return {
      clientId: inspection.customerId,
      vehicleId: inspection.vehicleId,
      selfInspectionId: inspection.id,
      inspection,
    };
  }

  if (!data.clientId || !data.vehicleId) {
    throw new ConflictError(
      "Debes seleccionar un cliente y vehiculo existentes o una autoinspeccion revisada",
    );
  }

  await assertClientVehicleMatch(data.clientId, data.vehicleId);

  return {
    clientId: data.clientId,
    vehicleId: data.vehicleId,
    selfInspectionId: null,
    inspection: null,
  };
}

function normalizeQuoteItems(items: ReturnType<typeof createQuoteSchema.parse>["items"]) {
  return items.map((item, index) => {
    const quantity = new Prisma.Decimal(item.quantity.toFixed(2));
    const unitPrice = new Prisma.Decimal(item.unitPrice.toFixed(2));
    const lineTotal = quantity.mul(unitPrice).toDecimalPlaces(2);

    return {
      type: item.type,
      description: item.description,
      quantity,
      unitPrice,
      lineTotal,
      sortOrder: index + 1,
    };
  });
}

async function getQuoteStatusSummary(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      recipientType: true,
    },
  });

  if (!quote) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  return quote;
}

export async function listQuotes(input?: unknown) {
  const filters = listQuoteFiltersSchema.parse(input ?? {});

  return quoteRepository.list({
    search: filters.q?.trim(),
    status: filters.status,
    recipient: filters.recipient,
  });
}

export async function listQuoteEligibleSelfInspections() {
  return quoteRepository.listReviewedSelfInspections();
}

export async function getQuoteById(id: string) {
  const quote = await quoteRepository.findById(id);

  if (!quote) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  return {
    ...quote,
    canSend: quote.status === QuoteStatus.DRAFT,
    canApprove: quote.status === QuoteStatus.SENT,
    canReject: quote.status === QuoteStatus.SENT,
    canCreateWorkOrder: quote.status === QuoteStatus.APPROVED && !quote.workOrder,
    readyForWorkOrder: quote.status === QuoteStatus.APPROVED && !quote.workOrder,
  };
}

export async function createQuote(input: unknown, actorId: string) {
  const data = createQuoteSchema.parse(input);
  const association = await resolveQuoteAssociation(data);
  const normalizedItems = normalizeQuoteItems(data.items);
  const totalAmount = normalizedItems
    .reduce((accumulator, item) => accumulator.plus(item.lineTotal), new Prisma.Decimal(0))
    .toDecimalPlaces(2);
  const quoteNumber = await getNextQuoteNumber();

  const createdQuote = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        quoteNumber,
        clientId: association.clientId,
        vehicleId: association.vehicleId,
        selfInspectionId: association.selfInspectionId,
        recipientType: data.recipientType,
        status: QuoteStatus.DRAFT,
        summary: data.summary ?? association.inspection?.mainComplaint?.trim() ?? null,
        internalNotes: data.internalNotes ?? null,
        totalAmount,
        createdById: actorId,
        updatedById: actorId,
        items: {
          create: normalizedItems,
        },
      },
      select: {
        id: true,
      },
    });

    await tx.quoteStatusLog.create({
      data: {
        quoteId: quote.id,
        previousStatus: null,
        nextStatus: QuoteStatus.DRAFT,
        note: "Presupuesto creado en borrador",
        changedById: actorId,
      },
    });

    return quote;
  });

  return getQuoteById(createdQuote.id);
}

export async function sendQuote(id: string, input: unknown, actorId: string) {
  const data = transitionQuoteSchema.parse(input ?? {});
  const existing = await getQuoteStatusSummary(id);

  if (existing.status !== QuoteStatus.DRAFT) {
    throw new ConflictError("Solo los presupuestos en borrador pueden enviarse");
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.SENT,
        sentAt: new Date(),
        sentById: actorId,
        updatedById: actorId,
      },
    });

    await tx.quoteStatusLog.create({
      data: {
        quoteId: id,
        previousStatus: existing.status,
        nextStatus: QuoteStatus.SENT,
        note:
          data.note ??
          `Presupuesto enviado a ${QUOTE_RECIPIENT_LABELS[existing.recipientType].toLowerCase()} para revision`,
        changedById: actorId,
      },
    });
  });

  return getQuoteById(id);
}

export async function approveQuote(id: string, input: unknown, actorId: string) {
  const data = transitionQuoteSchema.parse(input ?? {});
  const existing = await getQuoteStatusSummary(id);

  if (existing.status === QuoteStatus.APPROVED) {
    throw new ConflictError("El presupuesto ya fue aprobado");
  }

  if (existing.status !== QuoteStatus.SENT) {
    throw new ConflictError("Solo los presupuestos enviados pueden aprobarse");
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: actorId,
        updatedById: actorId,
      },
    });

    await tx.quoteStatusLog.create({
      data: {
        quoteId: id,
        previousStatus: existing.status,
        nextStatus: QuoteStatus.APPROVED,
        note: data.note ?? "Presupuesto aprobado y listo para convertirse en orden de trabajo",
        changedById: actorId,
      },
    });
  });

  return getQuoteById(id);
}

export async function rejectQuote(id: string, input: unknown, actorId: string) {
  const data = transitionQuoteSchema.parse(input ?? {});
  const existing = await getQuoteStatusSummary(id);

  if (existing.status === QuoteStatus.REJECTED) {
    throw new ConflictError("El presupuesto ya fue rechazado");
  }

  if (existing.status !== QuoteStatus.SENT) {
    throw new ConflictError("Solo los presupuestos enviados pueden rechazarse");
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: actorId,
        updatedById: actorId,
      },
    });

    await tx.quoteStatusLog.create({
      data: {
        quoteId: id,
        previousStatus: existing.status,
        nextStatus: QuoteStatus.REJECTED,
        note: data.note ?? "Presupuesto rechazado. No puede convertirse en orden de trabajo",
        changedById: actorId,
      },
    });
  });

  return getQuoteById(id);
}
