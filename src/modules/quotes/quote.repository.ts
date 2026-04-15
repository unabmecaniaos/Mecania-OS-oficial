import { Prisma, QuoteRecipientType, QuoteStatus, SelfInspectionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const userPreviewSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
} satisfies Prisma.UserSelect;

const quoteListInclude = {
  client: true,
  vehicle: true,
  createdBy: {
    select: userPreviewSelect,
  },
  _count: {
    select: {
      items: true,
      statusLogs: true,
    },
  },
} satisfies Prisma.QuoteInclude;

const quoteDetailInclude = {
  client: true,
  vehicle: true,
  workOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
    },
  },
  selfInspection: {
    include: {
      customer: true,
      vehicle: true,
      vehicleSnapshot: true,
      reviews: {
        include: {
          reviewedBy: {
            select: userPreviewSelect,
          },
        },
        orderBy: {
          reviewedAt: "desc" as const,
        },
        take: 1,
      },
    },
  },
  createdBy: {
    select: userPreviewSelect,
  },
  updatedBy: {
    select: userPreviewSelect,
  },
  sentBy: {
    select: userPreviewSelect,
  },
  approvedBy: {
    select: userPreviewSelect,
  },
  rejectedBy: {
    select: userPreviewSelect,
  },
  items: {
    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],
  },
  statusLogs: {
    include: {
      changedBy: {
        select: userPreviewSelect,
      },
    },
    orderBy: {
      changedAt: "desc" as const,
    },
  },
} satisfies Prisma.QuoteInclude;

export const quoteRepository = {
  list(filters?: { search?: string; status?: QuoteStatus; recipient?: QuoteRecipientType }) {
    const where: Prisma.QuoteWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.recipient ? { recipientType: filters.recipient } : {}),
      ...(filters?.search
        ? {
            OR: [
              {
                quoteNumber: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                summary: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                client: {
                  fullName: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                vehicle: {
                  plate: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                vehicle: {
                  vin: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    };

    return prisma.quote.findMany({
      where,
      include: quoteListInclude,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.quote.findUnique({
      where: { id },
      include: quoteDetailInclude,
    });
  },

  findLastQuoteNumberForYear(prefix: string) {
    return prisma.quote.findFirst({
      where: {
        quoteNumber: {
          startsWith: prefix,
        },
      },
      select: {
        quoteNumber: true,
      },
      orderBy: {
        quoteNumber: "desc",
      },
    });
  },

  listReviewedSelfInspections() {
    return prisma.selfInspection.findMany({
      where: {
        status: SelfInspectionStatus.REVIEWED,
        vehicleId: {
          not: null,
        },
      },
      select: {
        id: true,
        customerId: true,
        vehicleId: true,
        mainComplaint: true,
        reviewedAt: true,
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            plate: true,
            vin: true,
          },
        },
        vehicleSnapshot: {
          select: {
            make: true,
            model: true,
            plate: true,
            vin: true,
          },
        },
      },
      orderBy: {
        reviewedAt: "desc",
      },
    });
  },

  findReviewedSelfInspectionById(id: string) {
    return prisma.selfInspection.findFirst({
      where: {
        id,
        status: SelfInspectionStatus.REVIEWED,
      },
      select: {
        id: true,
        customerId: true,
        vehicleId: true,
        mainComplaint: true,
        reviewedAt: true,
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            plate: true,
            vin: true,
          },
        },
        vehicleSnapshot: {
          select: {
            make: true,
            model: true,
            plate: true,
            vin: true,
          },
        },
      },
    });
  },
};
