import { MechanicPaymentConcept, Prisma, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const paymentInclude = {
  mechanic: {
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      role: true,
    },
  },
  issuedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.MechanicPaymentInclude;

export const payrollRepository = {
  listMechanics() {
    return prisma.user.findMany({
      where: {
        role: UserRole.MECHANIC,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  findActiveMechanicById(id: string) {
    return prisma.user.findFirst({
      where: {
        id,
        role: UserRole.MECHANIC,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  },

  listPayments(filters?: { mechanicId?: string }) {
    return prisma.mechanicPayment.findMany({
      where: {
        ...(filters?.mechanicId ? { mechanicId: filters.mechanicId } : {}),
      },
      include: paymentInclude,
      orderBy: {
        paidAt: "desc",
      },
    });
  },

  create(input: {
    mechanicId: string;
    issuedById: string;
    concept: MechanicPaymentConcept;
    amount: number;
    paidAt: Date;
    note?: string;
  }) {
    return prisma.mechanicPayment.create({
      data: input,
      include: paymentInclude,
    });
  },

  totalsByMechanic() {
    return prisma.mechanicPayment.groupBy({
      by: ["mechanicId"],
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });
  },
};

export type MechanicPaymentRecord = Prisma.MechanicPaymentGetPayload<{
  include: typeof paymentInclude;
}>;
