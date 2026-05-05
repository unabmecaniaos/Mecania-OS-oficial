import {
  BudgetItemType,
  BudgetStatus,
  PrismaClient,
  ReviewRecommendedNextStep,
  SelfInspectionAnswerType,
  SelfInspectionDepartment,
  SelfInspectionNoteType,
  SelfInspectionPhotoType,
  SelfInspectionReason,
  SelfInspectionRiskLevel,
  SelfInspectionSource,
  SelfInspectionStatus,
  UserRole,
  VehicleFuelType,
  VehicleTransmissionType,
  StockMovementSourceType,
  StockMovementType,
  WorkOrderStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function seedDemoData() {
  await prisma.budgetStatusLog.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.insuranceCasePhoto.deleteMany();
  await prisma.insuranceCase.deleteMany();
  await prisma.budgetReferenceCatalog.deleteMany();
  await prisma.selfInspectionStatusLog.deleteMany();
  await prisma.selfInspectionReview.deleteMany();
  await prisma.selfInspectionNote.deleteMany();
  await prisma.selfInspectionPhoto.deleteMany();
  await prisma.selfInspectionAnswer.deleteMany();
  await prisma.selfInspectionVehicleSnapshot.deleteMany();
  await prisma.selfInspection.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.workOrderPart.deleteMany();
  await prisma.workOrderStatusLog.deleteMany();
  await prisma.workOrderEvidence.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.repuesto.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await hash("Admin1234!", 10);
  const mechanicPassword = await hash("Mechanic1234!", 10);
  const customerPassword = await hash("Cliente1234!", 10);
  const liquidatorPassword = await hash("Liquidador1234!", 10);

  const [admin, mechanic, liquidator] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Tomas Herrera",
        email: "admin@mecaniaos.local",
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Paula Rojas",
        email: "mecanico@mecaniaos.local",
        passwordHash: mechanicPassword,
        role: UserRole.MECHANIC,
      },
    }),
    prisma.user.create({
      data: {
        name: "Liquidador",
        email: "liquidador@mecaniaos.local",
        passwordHash: liquidatorPassword,
        role: UserRole.LIQUIDATOR,
      },
    }),
  ]);

  const clientA = await prisma.client.create({
    data: {
      fullName: "Maria Gonzalez",
      localIdentifier: "12.345.678-9",
      phone: "+56 9 5555 1111",
      email: "maria@example.com",
      address: "Av. Los Talleres 145, Santiago",
    },
  });

  const clientB = await prisma.client.create({
    data: {
      fullName: "Juan Perez",
      localIdentifier: "9.876.543-2",
      phone: "+56 9 5555 2222",
      email: "juan@example.com",
      address: "Pasaje Mecanica 220, Santiago",
    },
  });

  await prisma.user.create({
    data: {
      name: clientA.fullName,
      email: "maria@example.com",
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER,
      client: {
        connect: {
          id: clientA.id,
        },
      },
    },
  });

  const vehicleA = await prisma.vehicle.create({
    data: {
      clientId: clientA.id,
      plate: "LTDK21",
      vin: "3VWFE21C04M000001",
      make: "Volkswagen",
      model: "Gol",
      year: 2020,
      color: "Blanco",
      mileage: 58200,
      fuelType: VehicleFuelType.GASOLINE,
      transmission: VehicleTransmissionType.MANUAL,
    },
  });

  const vehicleB = await prisma.vehicle.create({
    data: {
      clientId: clientB.id,
      plate: "KJRT54",
      vin: "1HGCM82633A000002",
      make: "Honda",
      model: "Civic",
      year: 2018,
      color: "Gris",
      mileage: 91450,
      fuelType: VehicleFuelType.GASOLINE,
      transmission: VehicleTransmissionType.AUTOMATIC,
    },
  });

  const insuranceCaseA = await prisma.insuranceCase.create({
    data: {
      caseNumber: "SIN-20260505-001",
      claimNumber: "CLM-2026-001",
      policyNumber: "POL-448812",
      clientId: clientA.id,
      vehicleId: vehicleA.id,
      liquidatorId: liquidator.id,
      incidentDate: new Date("2026-03-08T12:00:00.000Z"),
      incidentLocation: "Av. Macul con Quilin, Santiago",
      description:
        "Impacto delantero izquierdo con dano visible en foco, tapabarro y defensa. Se solicita evaluacion tecnica y economica del taller.",
      photos: {
        create: [
          {
            fileUrl: "/next.svg",
            storageKey: "seed/insurance-cases/case-a-front",
            fileName: "choque-frontal-izquierdo.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
          },
          {
            fileUrl: "/window.svg",
            storageKey: "seed/insurance-cases/case-a-context",
            fileName: "contexto-choque.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
          },
        ],
      },
    },
  });

  const insuranceCaseB = await prisma.insuranceCase.create({
    data: {
      caseNumber: "SIN-20260505-002",
      claimNumber: "CLM-2026-002",
      policyNumber: "POL-551990",
      clientId: clientB.id,
      vehicleId: vehicleB.id,
      liquidatorId: liquidator.id,
      incidentDate: new Date("2026-03-06T15:30:00.000Z"),
      incidentLocation: "Ruta 68, km 17",
      description:
        "Choque frontal moderado con desalineacion de capot y dano visible en sector delantero. Caso ya aprobado y en seguimiento de reparacion.",
      photos: {
        create: [
          {
            fileUrl: "/next.svg",
            storageKey: "seed/insurance-cases/case-b-front",
            fileName: "frente-siniestrado.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
          },
        ],
      },
    },
  });

  const budgetReferences = await prisma.budgetReferenceCatalog.createManyAndReturn({
    data: [
      {
        itemType: BudgetItemType.PART,
        name: "Kit embrague Volkswagen Gol G6/G7 1.6 16V",
        referenceCode: "REP-EMB-001",
        unitPrice: 104990,
        sourceLabel: "Rephaus Chile",
        sourceUrl:
          "https://rephaus.cl/products/kit-embrague-volkswagen-gol-g6-g7-saveiro-2010-en-adelante-1-6-16v",
        vehicleCompatibility: "Volkswagen Gol / Saveiro 1.6 16V",
      },
      {
        itemType: BudgetItemType.PART,
        name: "Bateria 12V 70Ah 680 CCA",
        referenceCode: "REP-ELE-001",
        unitPrice: 114290,
        sourceLabel: "Forzza",
        sourceUrl: "https://www.forzza.cl/product/bateria-12v-70ah-680-cca-pd-rocket",
        vehicleCompatibility: "Uso general liviano y camioneta",
      },
      {
        itemType: BudgetItemType.PART,
        name: "Filtro de aceite motor",
        referenceCode: "REP-LUB-001",
        unitPrice: 19990,
        sourceLabel: "Rav Motor",
        sourceUrl: "https://ravmotor.cl/collections/filtros-de-aceite",
        vehicleCompatibility: "Aplicacion segun motor y filtro equivalente",
      },
      {
        itemType: BudgetItemType.PART,
        name: "Amortiguador delantero Toyota Hilux 2005-2024",
        referenceCode: "REP-SUS-001",
        unitPrice: 64990,
        sourceLabel: "La Solucion de Repuestos",
        sourceUrl:
          "https://lasolucionderepuestos.cl/tienda/amortiguador-delantero-toyota-hilux-05-24/",
        vehicleCompatibility: "Toyota Hilux 2005-2024",
      },
      {
        itemType: BudgetItemType.LABOR,
        name: "Cambio de aceite express",
        referenceCode: "MO-LUB-001",
        unitPrice: 12000,
        sourceLabel: "Wild Biker",
        sourceUrl: "https://www.wildbiker.cl/service-page/cambio-aceite-express",
        vehicleCompatibility: "Servicio general",
      },
      {
        itemType: BudgetItemType.LABOR,
        name: "Cambio de pastillas de freno delanteras",
        referenceCode: "MO-FRE-001",
        unitPrice: 40000,
        sourceLabel: "Autos Rojas",
        sourceUrl: "https://autosrojas.cl/cambio-de-pastillas-de-freno/",
        vehicleCompatibility: "Servicio general",
      },
      {
        itemType: BudgetItemType.LABOR,
        name: "Cambio de kit de embrague",
        referenceCode: "MO-EMB-001",
        unitPrice: 160000,
        sourceLabel: "Quesuauto",
        sourceUrl: "https://quesuauto.cl/collections/servicios/products/cambio-de-embrague",
        vehicleCompatibility: "Servicio general",
      },
      {
        itemType: BudgetItemType.LABOR,
        name: "Cambio de amortiguadores delanteros",
        referenceCode: "MO-SUS-001",
        unitPrice: 114000,
        sourceLabel: "Motoride",
        sourceUrl: "https://www.motoride.cl/products/cambio-de-amortiguadores-y-espirales",
        vehicleCompatibility: "Par delantero",
      },
    ],
  });

  const workOrderA = await prisma.workOrder.create({
    data: {
      clientId: clientA.id,
      vehicleId: vehicleA.id,
      orderNumber: "OT-2026-0001",
      reason: "Ruido en frenos delanteros",
      initialDiagnosis: "Pastillas con desgaste avanzado",
      status: WorkOrderStatus.IN_REPAIR,
      intakeDate: new Date("2026-03-10T10:00:00.000Z"),
      estimatedDate: new Date("2026-03-15T18:00:00.000Z"),
      notes: "Revisar discos y liquido de frenos",
      createdById: admin.id,
      updatedById: mechanic.id,
      assignedTechnicianId: mechanic.id,
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: WorkOrderStatus.RECEIVED,
            note: "Ingreso inicial del vehiculo",
            changedById: admin.id,
            changedAt: new Date("2026-03-10T10:00:00.000Z"),
          },
          {
            previousStatus: WorkOrderStatus.RECEIVED,
            nextStatus: WorkOrderStatus.IN_DIAGNOSIS,
            note: "Inspeccion inicial",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-10T11:00:00.000Z"),
          },
          {
            previousStatus: WorkOrderStatus.IN_DIAGNOSIS,
            nextStatus: WorkOrderStatus.IN_REPAIR,
            note: "Cliente aprueba reemplazo",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-11T09:00:00.000Z"),
          },
        ],
      },
    },
  });

  const workOrderB = await prisma.workOrder.create({
    data: {
      clientId: clientB.id,
      vehicleId: vehicleB.id,
      insuranceCaseId: insuranceCaseB.id,
      orderNumber: "OT-2026-0002",
      reason: "Mantencion por kilometraje",
      initialDiagnosis: "Cambio de aceite y filtros",
      status: WorkOrderStatus.READY_FOR_DELIVERY,
      intakeDate: new Date("2026-03-09T09:30:00.000Z"),
      estimatedDate: new Date("2026-03-12T17:00:00.000Z"),
      notes: "Incluye inspeccion general",
      createdById: mechanic.id,
      updatedById: mechanic.id,
      assignedTechnicianId: mechanic.id,
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: WorkOrderStatus.RECEIVED,
            note: "Ingreso por mantencion",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-09T09:30:00.000Z"),
          },
          {
            previousStatus: WorkOrderStatus.RECEIVED,
            nextStatus: WorkOrderStatus.IN_REPAIR,
            note: "Mantencion en proceso",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-09T12:00:00.000Z"),
          },
          {
            previousStatus: WorkOrderStatus.IN_REPAIR,
            nextStatus: WorkOrderStatus.READY_FOR_DELIVERY,
            note: "Vehiculo listo",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-11T16:00:00.000Z"),
          },
        ],
      },
    },
  });

  const referenceMap = Object.fromEntries(
    budgetReferences.map((reference) => [reference.referenceCode, reference]),
  );

  await prisma.budget.create({
    data: {
      budgetNumber: "PRES-2026-0001",
      clientId: clientA.id,
      vehicleId: vehicleA.id,
      insuranceCaseId: insuranceCaseA.id,
      title: "Presupuesto frenos y mantencion ligera",
      summary:
        "Presupuesto preliminar basado en sintomas reportados por cliente y referencias reales de repuestos/mano de obra para validar aprobacion.",
      status: BudgetStatus.SENT,
      subtotalParts: 104980,
      subtotalLabor: 52000,
      subtotalSupplies: 0,
      totalAmount: 156980,
      sentAt: new Date("2026-03-12T14:00:00.000Z"),
      createdById: admin.id,
      updatedById: admin.id,
      items: {
        create: [
          {
            referenceCatalogId: referenceMap["REP-LUB-001"].id,
            itemType: BudgetItemType.PART,
            description: "Filtro de aceite motor",
            referenceCode: "REP-LUB-001",
            quantity: 1,
            unitPrice: 19990,
            subtotal: 19990,
            sourceLabel: referenceMap["REP-LUB-001"].sourceLabel,
            sourceUrl: referenceMap["REP-LUB-001"].sourceUrl,
            note: "Precio referencial de mercado para filtro equivalente.",
          },
          {
            referenceCatalogId: referenceMap["REP-ELE-001"].id,
            itemType: BudgetItemType.PART,
            description: "Bateria 12V 70Ah 680 CCA",
            referenceCode: "REP-ELE-001",
            quantity: 1,
            unitPrice: 84990,
            subtotal: 84990,
            sourceLabel: referenceMap["REP-ELE-001"].sourceLabel,
            sourceUrl: referenceMap["REP-ELE-001"].sourceUrl,
            note: "Monto ajustado por opcion equivalente instalada en taller.",
          },
          {
            referenceCatalogId: referenceMap["MO-LUB-001"].id,
            itemType: BudgetItemType.LABOR,
            description: "Cambio de aceite express",
            referenceCode: "MO-LUB-001",
            quantity: 1,
            unitPrice: 12000,
            subtotal: 12000,
            sourceLabel: referenceMap["MO-LUB-001"].sourceLabel,
            sourceUrl: referenceMap["MO-LUB-001"].sourceUrl,
          },
          {
            referenceCatalogId: referenceMap["MO-FRE-001"].id,
            itemType: BudgetItemType.LABOR,
            description: "Cambio de pastillas de freno delanteras",
            referenceCode: "MO-FRE-001",
            quantity: 1,
            unitPrice: 40000,
            subtotal: 40000,
            sourceLabel: referenceMap["MO-FRE-001"].sourceLabel,
            sourceUrl: referenceMap["MO-FRE-001"].sourceUrl,
          },
        ],
      },
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: BudgetStatus.DRAFT,
            note: "Presupuesto creado para revision interna.",
            changedById: admin.id,
          },
          {
            previousStatus: BudgetStatus.DRAFT,
            nextStatus: BudgetStatus.SENT,
            note: "Presupuesto enviado a cliente y liquidador.",
            changedById: admin.id,
            changedAt: new Date("2026-03-12T14:00:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.budget.create({
    data: {
      budgetNumber: "PRES-2026-0002",
      clientId: clientB.id,
      vehicleId: vehicleB.id,
      insuranceCaseId: insuranceCaseB.id,
      workOrderId: workOrderB.id,
      title: "Presupuesto reparacion frontal Honda Civic",
      summary:
        "Presupuesto aprobado por aseguradora y ya convertido en orden de trabajo para seguimiento del liquidador.",
      status: BudgetStatus.CONVERTED_TO_WORK_ORDER,
      subtotalParts: 179280,
      subtotalLabor: 154000,
      subtotalSupplies: 22000,
      totalAmount: 355280,
      sentAt: new Date("2026-03-10T18:00:00.000Z"),
      approvedAt: new Date("2026-03-11T09:00:00.000Z"),
      createdById: admin.id,
      updatedById: mechanic.id,
      items: {
        create: [
          {
            referenceCatalogId: referenceMap["REP-ELE-001"].id,
            itemType: BudgetItemType.PART,
            description: "Bateria 12V 70Ah 680 CCA",
            referenceCode: "REP-ELE-001",
            quantity: 1,
            unitPrice: 114290,
            subtotal: 114290,
            sourceLabel: referenceMap["REP-ELE-001"].sourceLabel,
            sourceUrl: referenceMap["REP-ELE-001"].sourceUrl,
          },
          {
            referenceCatalogId: referenceMap["REP-SUS-001"].id,
            itemType: BudgetItemType.PART,
            description: "Amortiguador delantero Toyota Hilux 2005-2024",
            referenceCode: "REP-SUS-001",
            quantity: 1,
            unitPrice: 64990,
            subtotal: 64990,
            sourceLabel: referenceMap["REP-SUS-001"].sourceLabel,
            sourceUrl: referenceMap["REP-SUS-001"].sourceUrl,
          },
          {
            referenceCatalogId: referenceMap["MO-SUS-001"].id,
            itemType: BudgetItemType.LABOR,
            description: "Cambio de amortiguadores delanteros",
            referenceCode: "MO-SUS-001",
            quantity: 1,
            unitPrice: 114000,
            subtotal: 114000,
            sourceLabel: referenceMap["MO-SUS-001"].sourceLabel,
            sourceUrl: referenceMap["MO-SUS-001"].sourceUrl,
          },
          {
            itemType: BudgetItemType.SUPPLY,
            description: "Insumos de enderezado y ajuste frontal",
            quantity: 1,
            unitPrice: 22000,
            subtotal: 22000,
            sourceLabel: "Ingreso manual",
            note: "Suministro complementario de reparacion.",
          },
          {
            referenceCatalogId: referenceMap["MO-FRE-001"].id,
            itemType: BudgetItemType.LABOR,
            description: "Cambio de pastillas de freno delanteras",
            referenceCode: "MO-FRE-001",
            quantity: 1,
            unitPrice: 40000,
            subtotal: 40000,
            sourceLabel: referenceMap["MO-FRE-001"].sourceLabel,
            sourceUrl: referenceMap["MO-FRE-001"].sourceUrl,
          },
        ],
      },
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: BudgetStatus.DRAFT,
            note: "Presupuesto creado desde caso de aseguradora.",
            changedById: admin.id,
            changedAt: new Date("2026-03-10T14:00:00.000Z"),
          },
          {
            previousStatus: BudgetStatus.DRAFT,
            nextStatus: BudgetStatus.SENT,
            note: "Presupuesto enviado a cliente y liquidador.",
            changedById: admin.id,
            changedAt: new Date("2026-03-10T18:00:00.000Z"),
          },
          {
            previousStatus: BudgetStatus.SENT,
            nextStatus: BudgetStatus.APPROVED,
            note: "Aprobado por liquidador.",
            changedById: liquidator.id,
            changedAt: new Date("2026-03-11T09:00:00.000Z"),
          },
          {
            previousStatus: BudgetStatus.APPROVED,
            nextStatus: BudgetStatus.CONVERTED_TO_WORK_ORDER,
            note: `Orden ${workOrderB.orderNumber} creada desde presupuesto aprobado.`,
            changedById: mechanic.id,
            changedAt: new Date("2026-03-11T10:30:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.workOrderEvidence.createMany({
    data: [
      {
        workOrderId: workOrderA.id,
        uploadedById: mechanic.id,
        fileUrl: "/next.svg",
        storageKey: "seed/work-orders/ot-2026-0001-evidence-1",
        fileName: "frenos-frontal.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 123456,
        note: "Desgaste visible en componentes delanteros",
      },
      {
        workOrderId: workOrderB.id,
        uploadedById: mechanic.id,
        fileUrl: "/window.svg",
        storageKey: "seed/work-orders/ot-2026-0002-evidence-1",
        fileName: "mantencion-aceite.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 123456,
        note: "Registro visual del servicio de mantencion",
      },
    ],
  });

  const [brakePads, oilFilter, engineOil] = await Promise.all([
    prisma.repuesto.create({
      data: {
        name: "Pastillas de freno delanteras",
        code: "PF-DEL-001",
        unitPrice: 42990,
        currentStock: 8,
        minimumStock: 4,
      },
    }),
    prisma.repuesto.create({
      data: {
        name: "Filtro de aceite",
        code: "FA-001",
        unitPrice: 19990,
        currentStock: 3,
        minimumStock: 3,
      },
    }),
    prisma.repuesto.create({
      data: {
        name: "Aceite sintetico 5W30",
        code: "ACE-5W30",
        unitPrice: 35990,
        currentStock: 12,
        minimumStock: 6,
      },
    }),
  ]);

  await prisma.stockMovement.createMany({
    data: [
      {
        repuestoId: brakePads.id,
        type: StockMovementType.INITIAL,
        quantity: 10,
        previousStock: 0,
        newStock: 10,
        reason: "Stock inicial seed",
        sourceType: StockMovementSourceType.INVENTORY,
        sourceId: brakePads.id,
        createdById: admin.id,
      },
      {
        repuestoId: brakePads.id,
        type: StockMovementType.OUT,
        quantity: -2,
        previousStock: 10,
        newStock: 8,
        reason: `Consumo en orden ${workOrderA.orderNumber}`,
        sourceType: StockMovementSourceType.WORK_ORDER,
        sourceId: workOrderA.id,
        createdById: mechanic.id,
      },
      {
        repuestoId: oilFilter.id,
        type: StockMovementType.INITIAL,
        quantity: 3,
        previousStock: 0,
        newStock: 3,
        reason: "Stock inicial seed",
        sourceType: StockMovementSourceType.INVENTORY,
        sourceId: oilFilter.id,
        createdById: admin.id,
      },
      {
        repuestoId: engineOil.id,
        type: StockMovementType.INITIAL,
        quantity: 12,
        previousStock: 0,
        newStock: 12,
        reason: "Stock inicial seed",
        sourceType: StockMovementSourceType.INVENTORY,
        sourceId: engineOil.id,
        createdById: admin.id,
      },
    ],
  });

  await prisma.workOrderPart.create({
    data: {
      workOrderId: workOrderA.id,
      repuestoId: brakePads.id,
      quantity: 2,
      createdById: mechanic.id,
    },
  });

  const publicDraftToken = "demo-self-inspection-2026";

  const selfInspectionDraft = await prisma.selfInspection.create({
    data: {
      customerId: clientA.id,
      vehicleId: vehicleA.id,
      status: SelfInspectionStatus.IN_PROGRESS,
      sourceChannel: SelfInspectionSource.SECURE_LINK,
      accessTokenHash: hashAccessToken(publicDraftToken),
      accessTokenExpiresAt: new Date("2026-04-01T23:59:59.000Z"),
      inspectionReason: SelfInspectionReason.STRANGE_NOISE,
      mainComplaint: "Golpeteo delantero al pasar baches y ruido al frenar en baja velocidad",
      canDrive: true,
      startedAt: new Date("2026-03-15T12:00:00.000Z"),
      overallRiskLevel: SelfInspectionRiskLevel.HIGH,
      summaryGenerated:
        "Maria Gonzalez reporta ruido delantero al circular y al frenar. Vehiculo Volkswagen Gol LTDK21 con 58.200 km. Riesgo preliminar alto por vibraciones, alerta ABS y ruido de suspension.",
      completionPercent: 80,
      lastCompletedStep: 7,
      vehicleSnapshot: {
        create: {
          plate: vehicleA.plate,
          vin: vehicleA.vin,
          make: vehicleA.make,
          model: vehicleA.model,
          year: vehicleA.year,
          color: vehicleA.color,
          mileage: vehicleA.mileage ?? 0,
          fuelType: VehicleFuelType.GASOLINE,
          transmission: VehicleTransmissionType.MANUAL,
          starts: true,
        },
      },
      answers: {
        create: [
          {
            section: "reason",
            questionKey: "reason_problem_since",
            questionLabel: "Desde cuando ocurre el problema",
            answerType: SelfInspectionAnswerType.TEXT,
            answerValue: "Hace 2 semanas",
          },
          {
            section: "reason",
            questionKey: "reason_issue_frequency",
            questionLabel: "El problema es constante o intermitente",
            answerType: SelfInspectionAnswerType.SINGLE_CHOICE,
            answerValue: "INTERMITTENT",
          },
          {
            section: "reason",
            questionKey: "reason_can_drive",
            questionLabel: "El vehiculo puede circular actualmente",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
          },
          {
            section: "brakes",
            questionKey: "brakes_abs_warning",
            questionLabel: "Se ha encendido luz de frenos o ABS",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
            severity: SelfInspectionRiskLevel.HIGH,
          },
          {
            section: "steeringSuspension",
            questionKey: "suspension_knocks",
            questionLabel: "Escucha golpes al pasar lomos de toro o baches",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
          },
          {
            section: "tires",
            questionKey: "tires_speed_vibration",
            questionLabel: "Siente vibracion a cierta velocidad",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
            severity: SelfInspectionRiskLevel.HIGH,
          },
        ],
      },
      photos: {
        create: [
          {
            photoType: SelfInspectionPhotoType.FRONTAL_FULL,
            fileUrl: "/next.svg",
            storageKey: "seed/self-inspections/front-01",
            fileName: "frontal-demo.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
            sortOrder: 1,
            isRequired: true,
          },
          {
            photoType: SelfInspectionPhotoType.PRIMARY_DAMAGE,
            fileUrl: "/window.svg",
            storageKey: "seed/self-inspections/damage-01",
            fileName: "dano-demo.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
            sortOrder: 11,
            isRequired: true,
          },
        ],
      },
      notes: {
        create: [
          {
            noteType: SelfInspectionNoteType.CUSTOMER_OBSERVATION,
            content: "[[additionalProblemContext]] El ruido aumenta con el vehiculo cargado.",
          },
        ],
      },
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: SelfInspectionStatus.DRAFT,
            note: "Autoinspeccion creada",
            changedAt: new Date("2026-03-15T12:00:00.000Z"),
          },
          {
            previousStatus: SelfInspectionStatus.DRAFT,
            nextStatus: SelfInspectionStatus.IN_PROGRESS,
            note: "Cliente avanzo en el formulario",
            changedAt: new Date("2026-03-15T12:30:00.000Z"),
          },
        ],
      },
    },
  });

  const selfInspectionReviewed = await prisma.selfInspection.create({
    data: {
      customerId: clientB.id,
      vehicleId: vehicleB.id,
      status: SelfInspectionStatus.REVIEWED,
      sourceChannel: SelfInspectionSource.STAFF_ASSISTED,
      inspectionReason: SelfInspectionReason.COLLISION_DAMAGE,
      mainComplaint: "Golpe frontal con desalineacion visible y testigo de motor encendido",
      canDrive: false,
      startedAt: new Date("2026-03-12T09:00:00.000Z"),
      submittedAt: new Date("2026-03-12T10:15:00.000Z"),
      reviewedAt: new Date("2026-03-12T12:00:00.000Z"),
      reviewerId: mechanic.id,
      overallRiskLevel: SelfInspectionRiskLevel.CRITICAL,
      summaryGenerated:
        "Juan Perez reporta siniestro frontal reciente. Vehiculo Honda Civic KJRT54 no circulable, con posible afectacion estructural y luz de motor encendida. Riesgo critico y derivacion a carroceria y diagnostico mecanico.",
      completionPercent: 100,
      lastCompletedStep: 9,
      vehicleSnapshot: {
        create: {
          plate: vehicleB.plate,
          vin: vehicleB.vin,
          make: vehicleB.make,
          model: vehicleB.model,
          year: vehicleB.year,
          color: vehicleB.color,
          mileage: vehicleB.mileage ?? 0,
          fuelType: VehicleFuelType.GASOLINE,
          transmission: VehicleTransmissionType.AUTOMATIC,
          starts: false,
        },
      },
      answers: {
        create: [
          {
            section: "reason",
            questionKey: "reason_can_drive",
            questionLabel: "El vehiculo puede circular actualmente",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: false,
            severity: SelfInspectionRiskLevel.CRITICAL,
          },
          {
            section: "operational",
            questionKey: "operational_dashboard_warning_lights",
            questionLabel: "Tiene testigos encendidos en el tablero",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
            severity: SelfInspectionRiskLevel.HIGH,
          },
          {
            section: "engine",
            questionKey: "engine_check_engine_light",
            questionLabel: "Se ha encendido luz de check engine",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
            severity: SelfInspectionRiskLevel.HIGH,
          },
          {
            section: "damage",
            questionKey: "damage_recent_collision",
            questionLabel: "El vehiculo sufrio choque o roce reciente",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
            severity: SelfInspectionRiskLevel.HIGH,
          },
          {
            section: "damage",
            questionKey: "damage_structural_impact",
            questionLabel: "Se observa posible golpe estructural",
            answerType: SelfInspectionAnswerType.BOOLEAN,
            answerValue: true,
            severity: SelfInspectionRiskLevel.CRITICAL,
          },
        ],
      },
      photos: {
        create: [
          {
            photoType: SelfInspectionPhotoType.FRONTAL_FULL,
            fileUrl: "/next.svg",
            storageKey: "seed/self-inspections/front-02",
            fileName: "frontal-golpe.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
            sortOrder: 1,
            isRequired: true,
          },
          {
            photoType: SelfInspectionPhotoType.DAMAGE_CONTEXT,
            fileUrl: "/window.svg",
            storageKey: "seed/self-inspections/context-02",
            fileName: "contexto-golpe.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 123456,
            sortOrder: 12,
            isRequired: true,
          },
        ],
      },
      notes: {
        create: [
          {
            noteType: SelfInspectionNoteType.CUSTOMER_OBSERVATION,
            content: "[[additionalProblemContext]] El cliente indica que el capot no cierra bien tras el choque.",
          },
          {
            noteType: SelfInspectionNoteType.INTERNAL_REVIEW,
            content: "Revisar soporte frontal, radiador y alineacion estructural antes de mover.",
            createdById: mechanic.id,
          },
        ],
      },
      reviews: {
        create: [
          {
            reviewedById: mechanic.id,
            riskAssessment: SelfInspectionRiskLevel.CRITICAL,
            internalSummary:
              "Golpe frontal con posible dano estructural. Vehiculo no apto para circular. Requiere ingreso con grua y diagnostico mixto mecanica/carroceria.",
            recommendedNextStep: ReviewRecommendedNextStep.REFER_BODY_PAINT,
            departmentSuggestion: SelfInspectionDepartment.BODY_PAINT,
            createWorkOrderSuggestion: true,
            createQuoteSuggestion: true,
            reviewedAt: new Date("2026-03-12T12:00:00.000Z"),
          },
        ],
      },
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: SelfInspectionStatus.DRAFT,
            note: "Autoinspeccion creada",
            changedAt: new Date("2026-03-12T09:00:00.000Z"),
          },
          {
            previousStatus: SelfInspectionStatus.DRAFT,
            nextStatus: SelfInspectionStatus.SUBMITTED,
            note: "Autoinspeccion enviada por cliente",
            changedAt: new Date("2026-03-12T10:15:00.000Z"),
          },
          {
            previousStatus: SelfInspectionStatus.SUBMITTED,
            nextStatus: SelfInspectionStatus.REVIEWED,
            note: "Revision interna registrada",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-12T12:00:00.000Z"),
          },
        ],
      },
    },
  });

  console.log("Seed listo");
  console.log(`Admin: admin@mecaniaos.local / Admin1234!`);
  console.log(`Mecanico: mecanico@mecaniaos.local / Mechanic1234!`);
  console.log(`Cliente: maria@example.com / Cliente1234!`);
  console.log(`Liquidador: liquidador@mecaniaos.local / Liquidador1234!`);
  console.log(`Orden activa de referencia: ${workOrderA.orderNumber}`);
  console.log(`Referencias de presupuesto: ${budgetReferences.length}`);
  console.log(`Autoinspeccion borrador: ${selfInspectionDraft.id}`);
  console.log(`Enlace seguro demo: /self-inspections/start/${publicDraftToken}`);
  console.log(`Autoinspeccion revisada: ${selfInspectionReviewed.id}`);
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  seedDemoData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
