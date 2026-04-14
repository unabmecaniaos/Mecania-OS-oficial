import {
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
  WorkOrderStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash } from "node:crypto";

  const prisma = new PrismaClient();

function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function main() {
  await prisma.quoteStatusLog.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.selfInspectionStatusLog.deleteMany();
  await prisma.selfInspectionReview.deleteMany();
  await prisma.selfInspectionNote.deleteMany();
  await prisma.selfInspectionPhoto.deleteMany();
  await prisma.selfInspectionAnswer.deleteMany();
  await prisma.selfInspectionVehicleSnapshot.deleteMany();
  await prisma.selfInspection.deleteMany();
  await prisma.workOrderStatusLog.deleteMany();
  await prisma.workOrderEvidence.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await hash("Admin1234!", 10);
  const mechanicPassword = await hash("Mechanic1234!", 10);
  const customerPassword = await hash("Cliente1234!", 10);

  const [admin, mechanic] = await Promise.all([
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
      workOrderId: workOrderB.id,
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

  await prisma.quote.create({
    data: {
      quoteNumber: "PTO-2026-0001",
      clientId: clientA.id,
      vehicleId: vehicleA.id,
      recipientType: "CUSTOMER",
      status: "DRAFT",
      summary: "Cambio de pastillas, rectificado y liquido de frenos",
      internalNotes: "Pendiente validar disponibilidad de discos",
      totalAmount: "185000",
      createdById: mechanic.id,
      updatedById: mechanic.id,
      items: {
        create: [
          {
            type: "LABOR",
            description: "Revision y desmontaje de tren delantero",
            quantity: "1",
            unitPrice: "45000",
            lineTotal: "45000",
            sortOrder: 1,
          },
          {
            type: "PART",
            description: "Juego de pastillas delanteras",
            quantity: "1",
            unitPrice: "82000",
            lineTotal: "82000",
            sortOrder: 2,
          },
          {
            type: "SUPPLY",
            description: "Liquido de frenos DOT 4",
            quantity: "2",
            unitPrice: "29000",
            lineTotal: "58000",
            sortOrder: 3,
          },
        ],
      },
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: "DRAFT",
            note: "Presupuesto creado en borrador",
            changedById: mechanic.id,
          },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "PTO-2026-0002",
      clientId: clientB.id,
      vehicleId: vehicleB.id,
      selfInspectionId: selfInspectionReviewed.id,
      recipientType: "INSURER",
      status: "APPROVED",
      summary: "Reparacion frontal inicial y alineacion estructural",
      internalNotes: "Aprobado como caso de seguro para iniciar OT",
      totalAmount: "680000",
      sentAt: new Date("2026-03-12T13:00:00.000Z"),
      sentById: mechanic.id,
      approvedAt: new Date("2026-03-13T09:30:00.000Z"),
      approvedById: admin.id,
      createdById: mechanic.id,
      updatedById: admin.id,
      items: {
        create: [
          {
            type: "LABOR",
            description: "Desarme frontal y diagnostico estructural",
            quantity: "1",
            unitPrice: "120000",
            lineTotal: "120000",
            sortOrder: 1,
          },
          {
            type: "PART",
            description: "Soporte frontal y piezas menores",
            quantity: "1",
            unitPrice: "410000",
            lineTotal: "410000",
            sortOrder: 2,
          },
          {
            type: "SUPPLY",
            description: "Materiales de montaje y alineacion",
            quantity: "1",
            unitPrice: "150000",
            lineTotal: "150000",
            sortOrder: 3,
          },
        ],
      },
      statusLogs: {
        create: [
          {
            previousStatus: null,
            nextStatus: "DRAFT",
            note: "Presupuesto creado desde autoinspeccion revisada",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-12T12:20:00.000Z"),
          },
          {
            previousStatus: "DRAFT",
            nextStatus: "SENT",
            note: "Presupuesto enviado a aseguradora",
            changedById: mechanic.id,
            changedAt: new Date("2026-03-12T13:00:00.000Z"),
          },
          {
            previousStatus: "SENT",
            nextStatus: "APPROVED",
            note: "Aseguradora aprueba reparacion inicial",
            changedById: admin.id,
            changedAt: new Date("2026-03-13T09:30:00.000Z"),
          },
        ],
      },
    },
  });

  console.log("Seed listo");
  console.log(`Admin: admin@mecaniaos.local / Admin1234!`);
  console.log(`Mecanico: mecanico@mecaniaos.local / Mechanic1234!`);
  console.log(`Cliente: maria@example.com / Cliente1234!`);
  console.log(`Orden activa de referencia: ${workOrderA.orderNumber}`);
  console.log(`Autoinspeccion borrador: ${selfInspectionDraft.id}`);
  console.log(`Enlace seguro demo: /self-inspections/start/${publicDraftToken}`);
  console.log(`Autoinspeccion revisada: ${selfInspectionReviewed.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
