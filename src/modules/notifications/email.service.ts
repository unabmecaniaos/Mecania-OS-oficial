import nodemailer from "nodemailer";
import { BudgetStatus, UserRole } from "@prisma/client";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { BUDGET_STATUS_LABELS } from "@/modules/budgets/budget.constants";

const emailLogger = createLogger("email-notifications");

type BudgetNotificationMode = "customer" | "liquidator" | "internal";

type BudgetEmailRecord = NonNullable<Awaited<ReturnType<typeof findBudgetForEmail>>>;

function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });
}

async function findBudgetForEmail(budgetId: string) {
  return prisma.budget.findFirst({
    where: {
      id: budgetId,
      deletedAt: null,
    },
    include: {
      client: true,
      vehicle: true,
      insuranceCase: {
        include: {
          liquidator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

function uniqEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      emails
        .map((email) => email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email && email.includes("@"))),
    ),
  );
}

async function getAdminEmails() {
  const admins = await prisma.user.findMany({
    where: {
      role: UserRole.ADMIN,
      active: true,
    },
    select: {
      email: true,
    },
  });

  return uniqEmails(admins.map((admin) => admin.email));
}

function resolveMode(budget: BudgetEmailRecord, preferredMode?: BudgetNotificationMode) {
  if (preferredMode) {
    return preferredMode;
  }

  return budget.insuranceCase ? "liquidator" : "customer";
}

function getBudgetLink(budget: BudgetEmailRecord, mode: BudgetNotificationMode) {
  if (mode === "liquidator" && budget.insuranceCaseId) {
    return `${env.APP_URL}/liquidador/cases/${budget.insuranceCaseId}`;
  }

  if (mode === "customer") {
    return `${env.APP_URL}/portal/budgets/${budget.id}`;
  }

  return `${env.APP_URL}/budgets/${budget.id}`;
}

function getExternalRecipient(budget: BudgetEmailRecord, mode: BudgetNotificationMode) {
  if (mode === "liquidator") {
    return {
      name: budget.insuranceCase?.liquidator.name ?? "Liquidadora",
      email: budget.insuranceCase?.liquidator.email,
    };
  }

  if (mode === "customer") {
    return {
      name: budget.client.fullName,
      email: budget.client.email,
    };
  }

  return {
    name: "Equipo interno",
    email: null,
  };
}

function buildBudgetEmail(input: {
  budget: BudgetEmailRecord;
  mode: BudgetNotificationMode;
  title: string;
  intro: string;
}) {
  const vehicleLabel = [
    input.budget.vehicle.make,
    input.budget.vehicle.model,
    input.budget.vehicle.plate ? `patente ${input.budget.vehicle.plate}` : null,
    `VIN ${input.budget.vehicle.vin}`,
  ]
    .filter(Boolean)
    .join(" / ");
  const statusLabel = BUDGET_STATUS_LABELS[input.budget.status] ?? input.budget.status;
  const link = getBudgetLink(input.budget, input.mode);
  const total = formatCurrency(input.budget.totalAmount);
  const externalRecipient = getExternalRecipient(input.budget, input.mode);
  const lines = [
    input.intro,
    "",
    `Folio: ${input.budget.budgetNumber}`,
    `Estado: ${statusLabel}`,
    `Cliente/liquidador: ${externalRecipient.name}`,
    `Vehiculo: ${vehicleLabel}`,
    `Total: ${total}`,
    `Link directo: ${link}`,
  ];

  return {
    subject: input.title,
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
        <h2 style="margin:0 0 12px">${input.title}</h2>
        <p>${input.intro}</p>
        <table style="border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:6px 12px 6px 0;color:#64748b">Folio</td><td><strong>${input.budget.budgetNumber}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b">Estado</td><td>${statusLabel}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b">Cliente/liquidador</td><td>${externalRecipient.name}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b">Vehiculo</td><td>${vehicleLabel}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b">Total</td><td><strong>${total}</strong></td></tr>
        </table>
        <p style="margin-top:18px"><a href="${link}" style="color:#2458c6">Abrir presupuesto</a></p>
      </div>
    `,
  };
}

async function sendBudgetEmail(input: {
  budgetId: string;
  mode?: BudgetNotificationMode;
  recipients: string[];
  title: string;
  intro: string;
}) {
  const transporter = getTransporter();

  if (!transporter) {
    emailLogger.warn("SMTP no configurado; se omite envio de correo", {
      budgetId: input.budgetId,
      missing: {
        SMTP_HOST: !env.SMTP_HOST,
        SMTP_PORT: !env.SMTP_PORT,
        SMTP_FROM: !env.SMTP_FROM,
      },
    });
    return;
  }

  const budget = await findBudgetForEmail(input.budgetId);

  if (!budget) {
    emailLogger.warn("No se encontro presupuesto para notificar", {
      budgetId: input.budgetId,
    });
    return;
  }

  const mode = resolveMode(budget, input.mode);
  const externalRecipient = getExternalRecipient(budget, mode);
  const recipients = uniqEmails([...input.recipients, externalRecipient.email]);

  if (recipients.length === 0) {
    emailLogger.warn("No hay destinatarios validos para notificacion de presupuesto", {
      budgetId: budget.id,
      budgetNumber: budget.budgetNumber,
      mode,
    });
    return;
  }

  const message = buildBudgetEmail({
    budget,
    mode,
    title: input.title,
    intro: input.intro,
  });

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: recipients,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    emailLogger.info("Notificacion de presupuesto enviada", {
      budgetId: budget.id,
      budgetNumber: budget.budgetNumber,
      mode,
      recipients: recipients.length,
    });
  } catch (error) {
    emailLogger.captureError("Fallo envio de notificacion de presupuesto", error, {
      budgetId: budget.id,
      budgetNumber: budget.budgetNumber,
      mode,
    });
  }
}

export async function notifyBudgetSent(
  budgetId: string,
  mode?: Extract<BudgetNotificationMode, "customer" | "liquidator" | "internal">,
) {
  await sendBudgetEmail({
    budgetId,
    mode,
    recipients: [],
    title: "Presupuesto enviado - MecaniaOS",
    intro: "Hay un presupuesto enviado y listo para revision.",
  });
}

export async function notifyBudgetResolved(
  budgetId: string,
  input?: {
    resolvedBy?: "customer" | "liquidator" | "internal";
    status?: BudgetStatus;
  },
) {
  const adminEmails = await getAdminEmails();
  const mode =
    input?.resolvedBy === "liquidator"
      ? "liquidator"
      : input?.resolvedBy === "customer"
        ? "customer"
        : "internal";

  await sendBudgetEmail({
    budgetId,
    mode,
    recipients: adminEmails,
    title: "Presupuesto resuelto - MecaniaOS",
    intro: "Un presupuesto recibio respuesta y requiere revision interna.",
  });
}
