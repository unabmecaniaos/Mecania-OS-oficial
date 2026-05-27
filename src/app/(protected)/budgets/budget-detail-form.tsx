"use client";

import { BudgetItemType, BudgetStatus } from "@prisma/client";
import { useActionState } from "react";

import {
  createWorkOrderFromBudgetAction,
  transitionBudgetStatusAction,
  updateBudgetDraftAction,
} from "@/app/(protected)/budgets/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { formatCurrency } from "@/lib/utils";
import { BUDGET_ITEM_TYPE_LABELS } from "@/modules/budgets/budget.constants";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";

type BudgetDetailFormProps = {
  budget: {
    id: string;
    title: string;
    summary: string | null;
    status: BudgetStatus;
    budgetNumber: string;
    subtotalParts: number;
    subtotalLabor: number;
    subtotalSupplies: number;
    totalAmount: number;
    workOrder: {
      id: string;
      orderNumber: string;
    } | null;
    insuranceCase: {
      id: string;
      caseNumber: string;
      liquidatorName: string;
    } | null;
    selfInspection: {
      id: string;
    } | null;
    client: {
      fullName: string;
    };
    vehicle: {
      make: string;
      model: string;
      plate: string | null;
      vin: string;
    };
    items: Array<{
      id: string;
      itemType: BudgetItemType;
      description: string;
      referenceCode: string | null;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      sourceLabel: string | null;
      sourceUrl: string | null;
      note: string | null;
    }>;
  };
};

export function BudgetDetailForm({ budget }: BudgetDetailFormProps) {
  const [state, formAction] = useActionState(
    updateBudgetDraftAction.bind(null, budget.id),
    initialActionState,
  );
  const [transitionState, transitionAction] = useActionState(
    transitionBudgetStatusAction.bind(null, budget.id),
    initialActionState,
  );
  const [createWorkOrderState, createWorkOrderAction] = useActionState(
    createWorkOrderFromBudgetAction.bind(null, budget.id),
    initialActionState,
  );
  const isDraft =
    budget.status === BudgetStatus.DRAFT || budget.status === BudgetStatus.REQUEST_CHANGES;
  const isLiquidatorBudget = Boolean(budget.insuranceCase);
  const isEditable = isDraft && !isLiquidatorBudget;
  const canCreateWorkOrder =
    (budget.status === BudgetStatus.APPROVED ||
      budget.status === BudgetStatus.PARTIALLY_APPROVED) &&
    !budget.workOrder &&
    !isLiquidatorBudget;
  const statusSummary = getBudgetStatusSummary(budget.status, isLiquidatorBudget);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {budget.budgetNumber}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">{budget.title}</h1>
              <BudgetStatusBadge status={budget.status} />
            </div>
            <p className="text-sm text-[color:var(--muted-strong)]">
              {budget.client.fullName} / {budget.vehicle.make} {budget.vehicle.model} /{" "}
              {budget.vehicle.plate ?? budget.vehicle.vin}
            </p>
            {budget.selfInspection ? (
              <p className="text-sm text-[color:var(--muted)]">
                Origen complementario:{" "}
                <a
                  className="font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                  href={`/self-inspections/${budget.selfInspection.id}`}
                >
                  Autoinspeccion revisada
                </a>
              </p>
            ) : null}
            {budget.insuranceCase ? (
              <p className="text-sm text-[color:var(--muted)]">
                Caso aseguradora:{" "}
                <a
                  className="font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                  href={`/insurance-cases/${budget.insuranceCase.id}`}
                >
                  {budget.insuranceCase.caseNumber}
                </a>{" "}
                / Liquidadora: {budget.insuranceCase.liquidatorName}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[rgba(185,28,28,0.18)] bg-[rgba(185,28,28,0.05)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#991b1b]">Repuestos</p>
              <p className="mt-3 text-2xl font-semibold text-[#7f1d1d]">
                {formatCurrency(budget.subtotalParts)}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.05)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">Mano de obra</p>
              <p className="mt-3 text-2xl font-semibold text-[#1e3a8a]">
                {formatCurrency(budget.subtotalLabor)}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-white p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Total</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                {formatCurrency(budget.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className={statusSummary.cardClassName}>
        {isLiquidatorBudget ? (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Estado del presupuesto
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
              {statusSummary.title}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
              {statusSummary.description}
            </p>
          </div>
        ) : (
          <form action={transitionAction} className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Flujo de aprobacion
              </p>
            </div>

            {isDraft ? (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-[color:var(--muted-strong)]"
                  htmlFor="transitionNote"
                >
                  Nota de estado
                </label>
                <Textarea
                  id="transitionNote"
                  name="note"
                  placeholder="Ej. Presupuesto revisado internamente y enviado al cliente."
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {isDraft ? (
                <Button name="nextStatus" type="submit" value={BudgetStatus.SENT}>
                  Enviar al cliente
                </Button>
              ) : null}
            </div>

            <FormMessage
              message={transitionState.error ?? transitionState.success}
              tone={transitionState.success ? "success" : "error"}
            />
          </form>
        )}

        {canCreateWorkOrder ? (
          <form action={createWorkOrderAction} className="mt-4 border-t border-[color:var(--border)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-[color:var(--foreground)]">
                Crear orden de trabajo
              </p>
              <SubmitButton
                label="Crear orden de trabajo"
                pendingLabel="Creando orden..."
              />
            </div>
            <FormMessage message={createWorkOrderState.error} />
          </form>
        ) : null}

        {budget.workOrder ? (
          <div className="mt-4 rounded-xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.05)] p-4">
            <p className="text-sm font-medium text-[#166534]">
              Orden de trabajo vinculada:{" "}
              <a
                className="underline decoration-[#166534] underline-offset-4"
                href={`/work-orders/${budget.workOrder.id}`}
              >
                {budget.workOrder.orderNumber}
              </a>
            </p>
          </div>
        ) : null}
      </Card>

      <form action={formAction} className="space-y-6">
        <Card className="rounded-2xl">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="title"
              >
                Titulo
              </label>
              <Input defaultValue={budget.title} disabled={!isEditable} id="title" name="title" />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="summary"
              >
                Resumen
              </label>
              <Textarea
                defaultValue={budget.summary ?? ""}
                disabled={!isEditable}
                id="summary"
                name="summary"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {budget.items.map((item) => (
            <Card
              className={
                item.itemType === BudgetItemType.PART
                  ? "rounded-2xl border-[rgba(185,28,28,0.14)]"
                  : "rounded-2xl border-[rgba(37,99,235,0.14)]"
              }
              key={item.id}
            >
              <div className="grid gap-4 xl:grid-cols-[1.4fr_160px_180px]">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                      {item.description}
                    </h2>
                    <Badge tone={item.itemType === BudgetItemType.PART ? "warning" : "info"}>
                      {BUDGET_ITEM_TYPE_LABELS[item.itemType]}
                    </Badge>
                  </div>
                  <p className="text-sm text-[color:var(--muted-strong)]">
                    {item.referenceCode ?? "Sin codigo"} / Base real: {formatCurrency(item.unitPrice)}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    Fuente:{" "}
                    {item.sourceUrl ? (
                      <a
                        className="font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                        href={item.sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.sourceLabel}
                      </a>
                    ) : (
                      item.sourceLabel ?? "Sin referencia"
                    )}
                  </p>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-[color:var(--muted-strong)]"
                      htmlFor={`lineNote:${item.id}`}
                    >
                      Nota
                    </label>
                    <Input
                      defaultValue={item.note ?? ""}
                      disabled={!isEditable}
                      id={`lineNote:${item.id}`}
                      name={`lineNote:${item.id}`}
                      placeholder="Comentario opcional para este item"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-[color:var(--muted-strong)]"
                    htmlFor={`lineQty:${item.id}`}
                  >
                    Cantidad
                  </label>
                  <Input
                    defaultValue={item.quantity}
                    disabled={!isEditable}
                    id={`lineQty:${item.id}`}
                    min="1"
                    name={`lineQty:${item.id}`}
                    type="number"
                  />
                  <p className="text-xs text-[color:var(--muted)]">
                    {isEditable ? "Editable en borrador" : "Solo lectura"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-[color:var(--muted-strong)]"
                    htmlFor={`linePrice:${item.id}`}
                  >
                    Valor unitario
                  </label>
                  <Input
                    defaultValue={item.unitPrice}
                    disabled={!isEditable}
                    id={`linePrice:${item.id}`}
                    min="0"
                    name={`linePrice:${item.id}`}
                    type="number"
                  />
                  <p className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                    Subtotal actual: {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.success ? "success" : "error"}
        />
        {isEditable ? (
          <SubmitButton label="Guardar ajustes del borrador" pendingLabel="Actualizando..." />
        ) : null}
      </form>
    </div>
  );
}

function getBudgetStatusSummary(status: BudgetStatus, isLiquidatorBudget: boolean) {
  const baseCardClassName =
    status === BudgetStatus.APPROVED
      ? "rounded-2xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.05)]"
      : status === BudgetStatus.REJECTED
        ? "rounded-2xl border border-[rgba(185,28,28,0.18)] bg-[rgba(185,28,28,0.05)]"
        : status === BudgetStatus.PARTIALLY_APPROVED
          ? "rounded-2xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.05)]"
          : status === BudgetStatus.SENT
            ? "rounded-2xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.05)]"
            : "rounded-2xl";

  if (isLiquidatorBudget) {
    if (status === BudgetStatus.SENT) {
      return {
        cardClassName: baseCardClassName,
        title: "Esperando respuesta de liquidadora",
        description: "El presupuesto ya fue enviado automaticamente al portal de la liquidadora.",
      };
    }

    if (status === BudgetStatus.APPROVED) {
      return {
        cardClassName: baseCardClassName,
        title: "Aprobado por liquidadora",
        description: "La liquidadora aprobo el presupuesto completo.",
      };
    }

    if (status === BudgetStatus.PARTIALLY_APPROVED) {
      return {
        cardClassName: baseCardClassName,
        title: "Aprobado parcial por liquidadora",
        description: "La liquidadora aprobo parcialmente el presupuesto.",
      };
    }

    if (status === BudgetStatus.REJECTED) {
      return {
        cardClassName: baseCardClassName,
        title: "Rechazado por liquidadora",
        description: "La liquidadora rechazo este presupuesto.",
      };
    }
  }

  return {
    cardClassName: baseCardClassName,
    title: "Flujo de aprobacion",
    description: "Gestion interna del estado del presupuesto.",
  };
}
