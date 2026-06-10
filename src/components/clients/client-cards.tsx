import type { ReactNode } from "react";
import Link from "next/link";

import { MoveToTrashButton } from "@/components/trash/trash-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import type { listClients } from "@/modules/clients/client.service";
import type { listInternalInsuranceCases } from "@/modules/insurance-cases/insurance-case.service";

type WorkshopClient = Awaited<ReturnType<typeof listClients>>[number];
type LiquidatorClient = Awaited<ReturnType<typeof listInternalInsuranceCases>>[number];
type ClientCardMode = "clients" | "work-orders" | "budgets";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function CardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group flex min-h-[334px] flex-col rounded-[22px] border-[#cfd8e8] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#aebdda] hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]",
        className,
      )}
    >
      {children}
    </Card>
  );
}

function AvatarMark({ label, tone = "blue" }: { label: string; tone?: "blue" | "slate" }) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold",
        tone === "blue"
          ? "bg-[linear-gradient(135deg,#dbeafe,#eef4ff)] text-[#1d4ed8]"
          : "bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)] text-[#475569]",
      )}
    >
      {getInitials(label) || "CL"}
    </div>
  );
}

function ContactLine({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[color:var(--muted-strong)]">
      <span className="text-[#31527d]">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 3.2 10.8 19.8 19.8 0 0 1 .1 2.2 2 2 0 0 1 2.1 0h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L6 8a16 16 0 0 0 10 10l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z" transform="translate(1 1)" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M5 17h14" />
      <path d="M7 17v2" />
      <path d="M17 17v2" />
      <path d="M4 13l2-5h12l2 5" />
      <path d="M4 13h16v4H4z" />
    </svg>
  );
}

function Actions({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
      <Link href={secondaryHref}>
        <Button className="w-full" size="sm" variant="secondary">
          {secondaryLabel}
        </Button>
      </Link>
      <Link href={primaryHref}>
        <Button className="w-full" size="sm">
          {primaryLabel}
        </Button>
      </Link>
    </div>
  );
}

function getWorkshopActions(clientId: string, mode: ClientCardMode) {
  if (mode === "budgets") {
    return {
      primaryHref: `/budgets/new?kind=workshop&clientId=${clientId}`,
      primaryLabel: "Presupuesto",
      secondaryHref: `/clients/${clientId}`,
      secondaryLabel: "Ver ficha",
    };
  }

  if (mode === "work-orders") {
    return {
      primaryHref: `/work-orders/new?clientId=${clientId}`,
      primaryLabel: "Nueva orden",
      secondaryHref: `/clients/${clientId}`,
      secondaryLabel: "Ver ficha",
    };
  }

  return {
    primaryHref: `/work-orders/new?clientId=${clientId}`,
    primaryLabel: "Nueva orden",
    secondaryHref: `/clients/${clientId}`,
    secondaryLabel: "Ver ficha",
  };
}

export function WorkshopClientCard({
  badge,
  client,
  mode,
  showTrash = false,
  trashRedirectTo = "/clients",
}: {
  badge?: ReactNode;
  client: WorkshopClient;
  mode: ClientCardMode;
  showTrash?: boolean;
  trashRedirectTo?: string;
}) {
  const actions = getWorkshopActions(client.id, mode);

  return (
    <CardShell>
      <div className="flex items-start justify-between gap-3">
        <AvatarMark label={client.fullName} />
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone="info">Cliente taller</Badge>
          {showTrash ? (
            <MoveToTrashButton entityId={client.id} entityType="client" redirectTo={trashRedirectTo} />
          ) : null}
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <h2 className="truncate font-heading text-xl font-semibold text-[color:var(--foreground)]">
          {client.fullName}
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
          Cliente particular
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <ContactLine icon={<MailIcon />}>{client.email}</ContactLine>
        <ContactLine icon={<PhoneIcon />}>{client.phone}</ContactLine>
      </div>

      <div className="mt-5 rounded-[14px] bg-[#eef4ff] p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Vehiculos y ordenes</p>
        <div className="mt-2 flex items-start gap-2 text-sm font-semibold text-[#0b4ecb]">
          <CarIcon />
          <span>
            {client._count.vehicles} vehiculo{client._count.vehicles === 1 ? "" : "s"} /{" "}
            {client._count.workOrders} orden{client._count.workOrders === 1 ? "" : "es"}
          </span>
        </div>
      </div>

      {badge ? <div className="mt-3">{badge}</div> : null}

      <p className="mt-3 text-xs text-[color:var(--muted)]">Creado el {formatDate(client.createdAt)}</p>

      <Actions {...actions} />
    </CardShell>
  );
}

function getLiquidatorActions(insuranceCase: LiquidatorClient, mode: ClientCardMode) {
  if (mode === "budgets") {
    return {
      primaryHref: `/budgets/new?kind=liquidator&insuranceCaseId=${insuranceCase.id}`,
      primaryLabel: insuranceCase.latestBudget ? "Nueva version" : "Presupuesto",
      secondaryHref: insuranceCase.latestBudget
        ? `/budgets/${insuranceCase.latestBudget.id}`
        : `/insurance-cases/${insuranceCase.id}`,
      secondaryLabel: insuranceCase.latestBudget ? "Ver actual" : "Ver ficha",
    };
  }

  if (mode === "work-orders") {
    return {
      primaryHref: insuranceCase.currentWorkOrder
        ? `/work-orders/${insuranceCase.currentWorkOrder.id}`
        : `/work-orders/new?insuranceCaseId=${insuranceCase.id}`,
      primaryLabel: insuranceCase.currentWorkOrder ? "Abrir orden" : "Nueva orden",
      secondaryHref: `/insurance-cases/${insuranceCase.id}`,
      secondaryLabel: "Ver ficha",
    };
  }

  return {
    primaryHref: insuranceCase.currentWorkOrder
      ? `/work-orders/${insuranceCase.currentWorkOrder.id}`
      : `/budgets/new?kind=liquidator&insuranceCaseId=${insuranceCase.id}`,
    primaryLabel: insuranceCase.currentWorkOrder ? "Abrir orden" : "Presupuesto",
    secondaryHref: `/insurance-cases/${insuranceCase.id}`,
    secondaryLabel: "Ver ficha",
  };
}

export function LiquidatorClientCard({
  badge,
  insuranceCase,
  mode,
}: {
  badge?: ReactNode;
  insuranceCase: LiquidatorClient;
  mode: ClientCardMode;
}) {
  const actions = getLiquidatorActions(insuranceCase, mode);

  return (
    <CardShell>
      <div className="flex items-start justify-between gap-3">
        <AvatarMark label={insuranceCase.ownerFullName} tone="slate" />
        <div className="flex flex-wrap justify-end gap-2">
          <Badge>Cliente liquidadora</Badge>
          <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-semibold text-[#027a48]">
            {insuranceCase.stageLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <h2 className="truncate font-heading text-xl font-semibold text-[color:var(--foreground)]">
          {insuranceCase.ownerFullName}
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
          Caso {insuranceCase.caseNumber}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <ContactLine icon={<MailIcon />}>
          {insuranceCase.ownerEmail ?? insuranceCase.liquidator.email}
        </ContactLine>
        <ContactLine icon={<PhoneIcon />}>{insuranceCase.ownerPhone}</ContactLine>
      </div>

      <div className="mt-5 rounded-[14px] bg-[#eef4ff] p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Vehiculo asociado</p>
        <div className="mt-2 flex items-start gap-2 text-sm font-semibold text-[#0b4ecb]">
          <CarIcon />
          <span>
            {insuranceCase.vehicle.make} {insuranceCase.vehicle.model} -{" "}
            {insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Presupuesto
          </p>
          <div className="mt-2">
            {insuranceCase.latestBudget ? (
              <BudgetStatusBadge status={insuranceCase.latestBudget.status} />
            ) : (
              <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Pendiente</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">OT</p>
          <div className="mt-2">
            {insuranceCase.currentWorkOrder ? (
              <StatusBadge status={insuranceCase.currentWorkOrder.status} />
            ) : (
              <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Sin OT</span>
            )}
          </div>
        </div>
      </div>

      {badge ? <div className="mt-3">{badge}</div> : null}

      {insuranceCase.latestBudget ? (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Monto actual: {formatCurrency(insuranceCase.latestBudget.totalAmount)}
        </p>
      ) : (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Choque registrado el {formatDate(insuranceCase.incidentDate)}
        </p>
      )}

      <Actions {...actions} />
    </CardShell>
  );
}
