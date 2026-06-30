import { Prisma } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { addDays, getDaysUntil } from "@/lib/utils";

const TRASH_CLEAR_STATE = {
  deletedAt: null,
  purgeAt: null,
};

export const TRASH_RETENTION_DAYS = 7;
export type TrashEntityType =
  | "client"
  | "vehicle"
  | "workOrder"
  | "budget"
  | "repuesto"
  | "selfInspection";

type TrashTx = Prisma.TransactionClient;

function createTrashState() {
  const deletedAt = new Date();

  return {
    deletedAt,
    purgeAt: addDays(deletedAt, TRASH_RETENTION_DAYS),
  };
}

function toTrashPresentation<T extends { deletedAt: Date | null; purgeAt: Date | null }>(item: T) {
  return {
    ...item,
    daysRemaining: getDaysUntil(item.purgeAt),
  };
}

async function hardDeleteBudgetTx(tx: TrashTx, id: string) {
  await tx.budget.delete({
    where: { id },
  });
}

async function hardDeleteSelfInspectionTx(tx: TrashTx, id: string) {
  await tx.selfInspection.delete({
    where: { id },
  });
}

async function hardDeleteWorkOrderTx(tx: TrashTx, id: string) {
  await tx.workOrder.delete({
    where: { id },
  });
}

async function deleteInsuranceCasesForVehicleTx(tx: TrashTx, vehicleId: string) {
  await tx.insuranceCase.deleteMany({
    where: {
      vehicleId,
    },
  });
}

async function deleteInsuranceCasesForClientTx(tx: TrashTx, clientId: string) {
  await tx.insuranceCase.deleteMany({
    where: {
      clientId,
    },
  });
}

async function hardDeleteVehicleTx(tx: TrashTx, id: string) {
  const [workOrders, budgets, selfInspections] = await Promise.all([
    tx.workOrder.findMany({
      where: { vehicleId: id },
      select: { id: true },
    }),
    tx.budget.findMany({
      where: { vehicleId: id },
      select: { id: true },
    }),
    tx.selfInspection.findMany({
      where: { vehicleId: id },
      select: { id: true },
    }),
  ]);

  for (const workOrder of workOrders) {
    await hardDeleteWorkOrderTx(tx, workOrder.id);
  }

  for (const budget of budgets) {
    await hardDeleteBudgetTx(tx, budget.id);
  }

  for (const inspection of selfInspections) {
    await hardDeleteSelfInspectionTx(tx, inspection.id);
  }

  await deleteInsuranceCasesForVehicleTx(tx, id);

  await tx.vehicle.delete({
    where: { id },
  });
}

async function hardDeleteClientTx(tx: TrashTx, id: string) {
  const [vehicles, selfInspections] = await Promise.all([
    tx.vehicle.findMany({
      where: { clientId: id },
      select: { id: true },
    }),
    tx.selfInspection.findMany({
      where: {
        customerId: id,
        vehicleId: null,
      },
      select: { id: true },
    }),
  ]);

  for (const vehicle of vehicles) {
    await hardDeleteVehicleTx(tx, vehicle.id);
  }

  for (const inspection of selfInspections) {
    await hardDeleteSelfInspectionTx(tx, inspection.id);
  }

  await deleteInsuranceCasesForClientTx(tx, id);

  await tx.user.deleteMany({
    where: {
      clientId: id,
      role: "CUSTOMER",
    },
  });

  await tx.client.delete({
    where: { id },
  });
}

async function hardDeleteRepuestoTx(tx: TrashTx, id: string) {
  await tx.workOrderPart.deleteMany({
    where: {
      repuestoId: id,
    },
  });

  await tx.stockMovement.deleteMany({
    where: {
      repuestoId: id,
    },
  });

  await tx.repuesto.delete({
    where: { id },
  });
}

async function restoreSelfInspectionTx(tx: TrashTx, id: string) {
  const inspection = await tx.selfInspection.findFirst({
    where: {
      id,
      deletedAt: {
        not: null,
      },
    },
    include: {
      customer: {
        select: {
          deletedAt: true,
        },
      },
      vehicle: {
        select: {
          deletedAt: true,
        },
      },
      workOrder: {
        select: {
          deletedAt: true,
        },
      },
    },
  });

  if (!inspection) {
    throw new NotFoundError("Autoinspeccion no encontrada en papelera");
  }

  if (inspection.customer.deletedAt) {
    throw new ConflictError("Debes restaurar primero el cliente asociado");
  }

  await tx.selfInspection.update({
    where: { id },
    data: {
      ...TRASH_CLEAR_STATE,
      ...(inspection.vehicle?.deletedAt
        ? {
            vehicle: {
              disconnect: true,
            },
          }
        : {}),
      ...(inspection.workOrder?.deletedAt
        ? {
            workOrder: {
              disconnect: true,
            },
          }
        : {}),
    },
  });
}

export async function restoreSelfInspection(id: string) {
  await prisma.$transaction((tx) => restoreSelfInspectionTx(tx, id));
}

export async function purgeExpiredTrash() {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const [expiredClients, expiredVehicles, expiredWorkOrders, expiredBudgets, expiredRepuestos, expiredInspections] =
      await Promise.all([
        tx.client.findMany({
          where: {
            deletedAt: {
              not: null,
            },
            purgeAt: {
              lte: now,
            },
          },
          select: { id: true },
        }),
        tx.vehicle.findMany({
          where: {
            deletedAt: {
              not: null,
            },
            purgeAt: {
              lte: now,
            },
          },
          select: { id: true },
        }),
        tx.workOrder.findMany({
          where: {
            deletedAt: {
              not: null,
            },
            purgeAt: {
              lte: now,
            },
          },
          select: { id: true },
        }),
        tx.budget.findMany({
          where: {
            deletedAt: {
              not: null,
            },
            purgeAt: {
              lte: now,
            },
          },
          select: { id: true },
        }),
        tx.repuesto.findMany({
          where: {
            deletedAt: {
              not: null,
            },
            purgeAt: {
              lte: now,
            },
          },
          select: { id: true },
        }),
        tx.selfInspection.findMany({
          where: {
            deletedAt: {
              not: null,
            },
            purgeAt: {
              lte: now,
            },
          },
          select: { id: true },
        }),
      ]);

    for (const client of expiredClients) {
      await hardDeleteClientTx(tx, client.id);
    }

    for (const vehicle of expiredVehicles) {
      const stillExists = await tx.vehicle.findUnique({
        where: { id: vehicle.id },
        select: { id: true },
      });

      if (stillExists) {
        await hardDeleteVehicleTx(tx, vehicle.id);
      }
    }

    for (const workOrder of expiredWorkOrders) {
      const stillExists = await tx.workOrder.findUnique({
        where: { id: workOrder.id },
        select: { id: true },
      });

      if (stillExists) {
        await hardDeleteWorkOrderTx(tx, workOrder.id);
      }
    }

    for (const budget of expiredBudgets) {
      const stillExists = await tx.budget.findUnique({
        where: { id: budget.id },
        select: { id: true },
      });

      if (stillExists) {
        await hardDeleteBudgetTx(tx, budget.id);
      }
    }

    for (const repuesto of expiredRepuestos) {
      const stillExists = await tx.repuesto.findUnique({
        where: { id: repuesto.id },
        select: { id: true },
      });

      if (stillExists) {
        await hardDeleteRepuestoTx(tx, repuesto.id);
      }
    }

    for (const inspection of expiredInspections) {
      const stillExists = await tx.selfInspection.findUnique({
        where: { id: inspection.id },
        select: { id: true },
      });

      if (stillExists) {
        await hardDeleteSelfInspectionTx(tx, inspection.id);
      }
    }
  });
}

export async function trashClient(id: string) {
  const trashState = createTrashState();

  await prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundError("Cliente no encontrado");
    }

    await tx.client.update({
      where: { id },
      data: trashState,
    });

    await Promise.all([
      tx.user.updateMany({
        where: {
          clientId: id,
          role: "CUSTOMER",
        },
        data: {
          active: false,
        },
      }),
      tx.session.deleteMany({
        where: {
          user: {
            clientId: id,
            role: "CUSTOMER",
          },
        },
      }),
      tx.vehicle.updateMany({
        where: {
          clientId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.workOrder.updateMany({
        where: {
          clientId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.budget.updateMany({
        where: {
          clientId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.selfInspection.updateMany({
        where: {
          customerId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.insuranceCase.deleteMany({
        where: {
          clientId: id,
        },
      }),
    ]);
  });
}

export async function restoreClient(id: string) {
  await prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundError("Cliente no encontrado en papelera");
    }

    await tx.client.update({
      where: { id },
      data: TRASH_CLEAR_STATE,
    });

    await Promise.all([
      tx.user.updateMany({
        where: {
          clientId: id,
          role: "CUSTOMER",
        },
        data: {
          active: true,
        },
      }),
      tx.vehicle.updateMany({
        where: { clientId: id },
        data: TRASH_CLEAR_STATE,
      }),
      tx.workOrder.updateMany({
        where: { clientId: id },
        data: TRASH_CLEAR_STATE,
      }),
      tx.budget.updateMany({
        where: { clientId: id },
        data: TRASH_CLEAR_STATE,
      }),
      tx.selfInspection.updateMany({
        where: { customerId: id },
        data: TRASH_CLEAR_STATE,
      }),
    ]);
  });
}

export async function deleteClientForever(id: string) {
  await prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundError("Cliente no encontrado en papelera");
    }

    await hardDeleteClientTx(tx, id);
  });
}

export async function trashVehicle(id: string) {
  const trashState = createTrashState();

  await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundError("Vehiculo no encontrado");
    }

    await tx.vehicle.update({
      where: { id },
      data: trashState,
    });

    await Promise.all([
      tx.workOrder.updateMany({
        where: {
          vehicleId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.budget.updateMany({
        where: {
          vehicleId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.selfInspection.updateMany({
        where: {
          vehicleId: id,
          deletedAt: null,
        },
        data: trashState,
      }),
      tx.insuranceCase.deleteMany({
        where: {
          vehicleId: id,
        },
      }),
    ]);
  });
}

export async function restoreVehicle(id: string) {
  await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      include: {
        client: {
          select: {
            deletedAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundError("Vehiculo no encontrado en papelera");
    }

    if (vehicle.client.deletedAt) {
      throw new ConflictError("Debes restaurar primero el cliente asociado");
    }

    await tx.vehicle.update({
      where: { id },
      data: TRASH_CLEAR_STATE,
    });

    await Promise.all([
      tx.workOrder.updateMany({
        where: { vehicleId: id },
        data: TRASH_CLEAR_STATE,
      }),
      tx.budget.updateMany({
        where: { vehicleId: id },
        data: TRASH_CLEAR_STATE,
      }),
      tx.selfInspection.updateMany({
        where: { vehicleId: id },
        data: TRASH_CLEAR_STATE,
      }),
    ]);
  });
}

export async function deleteVehicleForever(id: string) {
  await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundError("Vehiculo no encontrado en papelera");
    }

    await hardDeleteVehicleTx(tx, id);
  });
}

export async function trashWorkOrder(id: string) {
  const trashState = createTrashState();

  await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!workOrder) {
      throw new NotFoundError("Orden de trabajo no encontrada");
    }

    await tx.workOrder.update({
      where: { id },
      data: trashState,
    });

    await tx.selfInspection.updateMany({
      where: {
        workOrderId: id,
        deletedAt: null,
      },
      data: trashState,
    });
  });
}

export async function restoreWorkOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      include: {
        client: {
          select: {
            deletedAt: true,
          },
        },
        vehicle: {
          select: {
            deletedAt: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundError("Orden de trabajo no encontrada en papelera");
    }

    if (workOrder.client.deletedAt || workOrder.vehicle.deletedAt) {
      throw new ConflictError("Debes restaurar primero el cliente y vehiculo asociados");
    }

    await tx.workOrder.update({
      where: { id },
      data: TRASH_CLEAR_STATE,
    });

    await tx.selfInspection.updateMany({
      where: { workOrderId: id },
      data: TRASH_CLEAR_STATE,
    });
  });
}

export async function deleteWorkOrderForever(id: string) {
  await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!workOrder) {
      throw new NotFoundError("Orden de trabajo no encontrada en papelera");
    }

    await hardDeleteWorkOrderTx(tx, id);
  });
}

export async function trashBudget(id: string) {
  const trashState = createTrashState();

  const updated = await prisma.budget.updateMany({
    where: {
      id,
      deletedAt: null,
    },
    data: trashState,
  });

  if (updated.count !== 1) {
    throw new NotFoundError("Presupuesto no encontrado");
  }
}

export async function restoreBudget(id: string) {
  await prisma.$transaction(async (tx) => {
    const budget = await tx.budget.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      include: {
        client: {
          select: {
            deletedAt: true,
          },
        },
        vehicle: {
          select: {
            deletedAt: true,
          },
        },
        selfInspection: {
          select: {
            deletedAt: true,
          },
        },
        workOrder: {
          select: {
            deletedAt: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundError("Presupuesto no encontrado en papelera");
    }

    if (budget.client.deletedAt || budget.vehicle.deletedAt) {
      throw new ConflictError("Debes restaurar primero el cliente y vehiculo asociados");
    }

    await tx.budget.update({
      where: { id },
      data: {
        ...TRASH_CLEAR_STATE,
        ...(budget.selfInspection?.deletedAt
          ? {
              selfInspection: {
                disconnect: true,
              },
            }
          : {}),
        ...(budget.workOrder?.deletedAt
          ? {
              workOrder: {
                disconnect: true,
              },
            }
          : {}),
      },
    });
  });
}

export async function deleteBudgetForever(id: string) {
  await prisma.$transaction(async (tx) => {
    const budget = await tx.budget.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!budget) {
      throw new NotFoundError("Presupuesto no encontrado en papelera");
    }

    await hardDeleteBudgetTx(tx, id);
  });
}

export async function trashRepuesto(id: string) {
  const trashState = createTrashState();

  const updated = await prisma.repuesto.updateMany({
    where: {
      id,
      deletedAt: null,
    },
    data: trashState,
  });

  if (updated.count !== 1) {
    throw new NotFoundError("Repuesto no encontrado");
  }
}

export async function restoreRepuesto(id: string) {
  const updated = await prisma.repuesto.updateMany({
    where: {
      id,
      deletedAt: {
        not: null,
      },
    },
    data: TRASH_CLEAR_STATE,
  });

  if (updated.count !== 1) {
    throw new NotFoundError("Repuesto no encontrado en papelera");
  }
}

export async function deleteRepuestoForever(id: string) {
  await prisma.$transaction(async (tx) => {
    const repuesto = await tx.repuesto.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!repuesto) {
      throw new NotFoundError("Repuesto no encontrado en papelera");
    }

    await hardDeleteRepuestoTx(tx, id);
  });
}

export async function listTrashItems() {
  const [clients, vehicles, workOrders, budgets, repuestos, selfInspections] = await Promise.all([
    prisma.client.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        deletedAt: true,
        purgeAt: true,
        _count: {
          select: {
            vehicles: true,
            workOrders: true,
            budgets: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
    prisma.vehicle.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        make: true,
        model: true,
        plate: true,
        vin: true,
        deletedAt: true,
        purgeAt: true,
        client: {
          select: {
            fullName: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
            budgets: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
    prisma.workOrder.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        reason: true,
        status: true,
        deletedAt: true,
        purgeAt: true,
        client: {
          select: {
            fullName: true,
          },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            plate: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
    prisma.budget.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        budgetNumber: true,
        title: true,
        status: true,
        deletedAt: true,
        purgeAt: true,
        client: {
          select: {
            fullName: true,
          },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            plate: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
    prisma.repuesto.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        currentStock: true,
        deletedAt: true,
        purgeAt: true,
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
    prisma.selfInspection.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        purgeAt: true,
        customer: {
          select: {
            fullName: true,
          },
        },
        vehicle: {
          select: {
            plate: true,
            vin: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
  ]);

  return {
    clients: clients.map(toTrashPresentation),
    vehicles: vehicles.map(toTrashPresentation),
    workOrders: workOrders.map(toTrashPresentation),
    budgets: budgets.map(toTrashPresentation),
    repuestos: repuestos.map(toTrashPresentation),
    selfInspections: selfInspections.map(toTrashPresentation),
  };
}
