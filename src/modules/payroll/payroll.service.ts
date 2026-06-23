import { UserRole } from "@prisma/client";

import { ForbiddenError, NotFoundError, AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { parseDateInput } from "@/lib/utils";
import { payrollRepository } from "@/modules/payroll/payroll.repository";
import {
  createMechanicPaymentSchema,
  payrollFilterSchema,
} from "@/modules/payroll/payroll.schemas";

const payrollLogger = createLogger("payroll");

type Actor = {
  id: string;
  role: UserRole;
};

function assertAdmin(actor: Actor) {
  if (actor.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Solo un administrador puede gestionar la nomina");
  }
}

function parseRequiredDate(value: string) {
  const date = parseDateInput(value);

  if (!date) {
    throw new AppError("La fecha de pago no es valida", 422);
  }

  return date;
}

export async function getPayrollOverview(input: unknown, actor: Actor) {
  assertAdmin(actor);

  const filters = payrollFilterSchema.parse(input);
  const [mechanics, payments, totals] = await Promise.all([
    payrollRepository.listMechanics(),
    payrollRepository.listPayments({
      mechanicId: filters.mechanicId,
    }),
    payrollRepository.totalsByMechanic(),
  ]);
  const totalsByMechanic = new Map(totals.map((entry) => [entry.mechanicId, entry._sum.amount ?? 0]));

  return {
    mechanics: mechanics.map((mechanic) => ({
      ...mechanic,
      totalPaid: totalsByMechanic.get(mechanic.id) ?? 0,
    })),
    payments,
    selectedMechanicId: filters.mechanicId ?? "",
  };
}

export async function createMechanicPayment(input: unknown, actor: Actor) {
  assertAdmin(actor);

  const data = createMechanicPaymentSchema.parse(input);
  const mechanic = await payrollRepository.findActiveMechanicById(data.mechanicId);

  if (!mechanic) {
    throw new NotFoundError("Mecanico activo no encontrado");
  }

  const payment = await payrollRepository.create({
    mechanicId: data.mechanicId,
    issuedById: actor.id,
    concept: data.concept,
    amount: data.amount,
    paidAt: parseRequiredDate(data.paidAt),
    note: data.note,
  });

  payrollLogger.info("Mechanic payment created", {
    paymentId: payment.id,
    mechanicId: payment.mechanicId,
    issuedById: actor.id,
    concept: payment.concept,
    amount: payment.amount,
  });

  return payment;
}
