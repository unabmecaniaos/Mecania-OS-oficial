import { TimeOffRequestStatus, UserRole } from "@prisma/client";

import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { parseDateInput } from "@/lib/utils";
import {
  createTimeOffRequestSchema,
  reviewTimeOffRequestSchema,
} from "@/modules/time-off/time-off.schemas";
import {
  timeOffRepository,
  type TimeOffRequestRecord,
} from "@/modules/time-off/time-off.repository";

const timeOffLogger = createLogger("time-off");

type Actor = {
  id: string;
  role: UserRole;
};

function parseRequiredDate(value: string, fieldLabel: string) {
  const date = parseDateInput(value);

  if (!date) {
    throw new AppError(`${fieldLabel} no es valida`, 422);
  }

  return date;
}

async function getWorkloadContext(request: Pick<TimeOffRequestRecord, "mechanicId" | "startDate" | "endDate">) {
  const [activeOrdersInRange, assignedOrdersInRange] = await Promise.all([
    timeOffRepository.countActiveOrdersInRange({
      startDate: request.startDate,
      endDate: request.endDate,
    }),
    timeOffRepository.countAssignedActiveOrdersInRange({
      mechanicId: request.mechanicId,
      startDate: request.startDate,
      endDate: request.endDate,
    }),
  ]);

  return {
    activeOrdersInRange,
    assignedOrdersInRange,
    isHighLoad: activeOrdersInRange >= 8 || assignedOrdersInRange >= 3,
  };
}

async function attachWorkloadContext(requests: TimeOffRequestRecord[]) {
  const enriched = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      workload: await getWorkloadContext(request),
    })),
  );

  return enriched;
}

export async function getTimeOffOverview(actor: Actor) {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.MECHANIC) {
    throw new ForbiddenError();
  }

  if (actor.role === UserRole.ADMIN) {
    const [requests, mechanics] = await Promise.all([
      timeOffRepository.listForAdmin(),
      timeOffRepository.listMechanics(),
    ]);
    const enrichedRequests = await attachWorkloadContext(requests);

    return {
      mode: "admin" as const,
      mechanics,
      pendingRequests: enrichedRequests.filter(
        (request) => request.status === TimeOffRequestStatus.PENDING,
      ),
      history: enrichedRequests.filter((request) => request.status !== TimeOffRequestStatus.PENDING),
    };
  }

  const requests = await timeOffRepository.listForMechanic(actor.id);

  return {
    mode: "mechanic" as const,
    requests,
  };
}

export async function createTimeOffRequest(input: unknown, actor: Actor) {
  if (actor.role !== UserRole.MECHANIC) {
    throw new ForbiddenError("Solo los mecanicos pueden crear solicitudes propias");
  }

  const data = createTimeOffRequestSchema.parse(input);
  const startDate = parseRequiredDate(data.startDate, "La fecha de inicio");
  const endDate = parseRequiredDate(data.endDate, "La fecha de termino");

  if (endDate < startDate) {
    throw new AppError("La fecha de termino debe ser igual o posterior a la fecha de inicio", 422);
  }

  const request = await timeOffRepository.create({
    mechanicId: actor.id,
    type: data.type,
    startDate,
    endDate,
    reason: data.reason,
  });

  timeOffLogger.info("Time off request created", {
    requestId: request.id,
    mechanicId: actor.id,
    type: request.type,
  });

  return request;
}

export async function reviewTimeOffRequest(requestId: string, input: unknown, actor: Actor) {
  if (actor.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Solo un administrador puede revisar solicitudes");
  }

  const data = reviewTimeOffRequestSchema.parse(input);
  const existing = await timeOffRepository.findById(requestId);

  if (!existing) {
    throw new NotFoundError("Solicitud no encontrada");
  }

  if (existing.status !== TimeOffRequestStatus.PENDING) {
    throw new AppError("Esta solicitud ya fue revisada", 422);
  }

  const request = await timeOffRepository.review({
    id: requestId,
    status: data.status,
    reviewedById: actor.id,
    reviewNote: data.reviewNote,
  });

  timeOffLogger.info("Time off request reviewed", {
    requestId: request.id,
    mechanicId: request.mechanicId,
    reviewedById: actor.id,
    status: request.status,
  });

  return request;
}
