"use client";

import { BudgetItemType, BudgetStatus } from "@prisma/client";
import { useActionState, useMemo, useRef, useState } from "react";

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
import {
  BUDGET_ITEM_TYPE_LABELS,
  BUDGET_VAT_PERCENT,
  DEFAULT_BUDGET_MARGIN_PCT,
} from "@/modules/budgets/budget.constants";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { calculateBudgetCommercialTotals } from "@/modules/budgets/budget-calculations";

function readInteger(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(Math.round(parsed), 0) : fallback;
}

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
    laborCostAmount: number;
    workshopMarginPct: number;
    discountAmount: number;
    vatAmount: number;
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

function buildBudgetPreview(
  budget: BudgetDetailFormProps["budget"],
  formData: FormData | null,
) {
  if (!formData) {
    return calculateBudgetCommercialTotals({
      subtotalParts: budget.subtotalParts,
      subtotalLabor: budget.subtotalLabor,
      subtotalSupplies: budget.subtotalSupplies,
      laborCostAmount: budget.laborCostAmount,
      workshopMarginPct: budget.workshopMarginPct,
      discountAmount: budget.discountAmount,
    });
  }

  const items = budget.items.map((item) => {
    const quantity = readInteger(formData.get(`lineQty:${item.id}`), item.quantity);
    const unitPrice = readInteger(formData.get(`linePrice:${item.id}`), item.unitPrice);

    return {
      itemType: item.itemType,
      quantity,
      unitPrice,
    };
  });

  const subtotalParts = items
    .filter((item) => item.itemType === BudgetItemType.PART)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const subtotalLabor = items
    .filter((item) => item.itemType === BudgetItemType.LABOR)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const subtotalSupplies = items
    .filter((item) => item.itemType === BudgetItemType.SUPPLY)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);

  return calculateBudgetCommercialTotals({
    subtotalParts,
    subtotalLabor,
    subtotalSupplies,
    laborCostAmount: subtotalLabor,
    workshopMarginPct: readInteger(
      formData.get("workshopMarginPct"),
      budget.workshopMarginPct || DEFAULT_BUDGET_MARGIN_PCT,
    ),
    discountAmount: readInteger(formData.get("discountAmount"), budget.discountAmount),
  });
}

function CommercialSummaryCard({
  preview,
  editable,
  defaultDiscountAmount,
  defaultMarginPct,
}: {
  preview: ReturnType<typeof calculateBudgetCommercialTotals>;
  editable: boolean;
  defaultDiscountAmount: number;
  defaultMarginPct: number;
}) {
  return (
    <Card className="rounded-2xl border-[rgba(37,99,235,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.94))]">
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Logica comercial
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">
            Margen, descuento e IVA del presupuesto
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            El total final se recalcula segun los items actuales, el margen del taller y el descuento aplicado.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="workshopMarginPct"
            >
              Margen del taller (%)
            </label>
            <Input
              defaultValue={defaultMarginPct}
              disabled={!editable}
              id="workshopMarginPct"
              max="999"
              min="0"
              name="workshopMarginPct"
              type="number"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="discountAmount"
            >
              Descuento comercial
            </label>
            <Input
              defaultValue={defaultDiscountAmount}
              disabled={!editable}
              id="discountAmount"
              max={preview.maxDiscountAmount}
              min="0"
              name="discountAmount"
              type="number"
            />
            <p className="text-xs text-[color:var(--muted)]">
              Maximo sugerido: {formatCurrency(preview.maxDiscountAmount)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Base comercial" tone="default" value={formatCurrency(preview.commercialBase)} />
          <SummaryTile label="Margen aplicado" tone="info" value={formatCurrency(preview.marginAmount)} />
          <SummaryTile label={`IVA ${BUDGET_VAT_PERCENT}%`} tone="warning" value={formatCurrency(preview.vatAmount)} />
          <SummaryTile label="Total final" tone="success" value={formatCurrency(preview.totalAmount)} />
        </div>
      </div>
    </Card>
  );
}

function SummaryTile({ label, tone, value }: { label: string; tone: "default" | "info" | "warning" | "success"; value: string }) {
  const className =
    tone === "info"
      ? "rounded-xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.06)] p-4"
      : tone === "warning"
        ? "rounded-xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.08)] p-4"
        : tone === "success"
          ? "rounded-xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.08)] p-4"
          : "rounded-xl border border-[color:var(--border)] bg-white p-4";

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

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
  const formRef = useRef<HTMLFormElement>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const preview = useMemo(
    () => buildBudgetPreview(budget, formRef.current ? new FormData(formRef.current) : null),
    [budget, previewVersion],
  );
  const isDraft =
    budget.status === BudgetStatus.DRAFT || budget.status === BudgetStatus.REQUEST_CHANGES;
  const canCreateWorkOrder =
    (budget.status === BudgetStatus.APPROVED ||
      budget.status === BudgetStatus.PARTIALLY_APPROVED) &&
    !budget.workOrder;

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
              {budget.client.fullName} / {budget.vehicle.make} {budget.vehicle.model} / {" "}
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
            <SummaryTile label="Repuestos" tone="warning" value={formatCurrency(preview.subtotalParts)} />
            <SummaryTile label="Costo mano de obra" tone="info" value={formatCurrency(preview.laborCostAmount)} />
            <SummaryTile label="Suministros" tone="default" value={formatCurrency(preview.subtotalSupplies)} />
            <SummaryTile label="Descuento" tone="default" value={formatCurrency(preview.discountAmount)} />
          </div>
        </div>
      </Card>

      <Card
        className={
          budget.status === BudgetStatus.APPROVED
            ? "rounded-2xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.05)]"
            : budget.status === BudgetStatus.REJECTED
              ? "rounded-2xl border border-[rgba(185,28,28,0.18)] bg-[rgba(185,28,28,0.05)]"
              : budget.status === BudgetStatus.REQUEST_CHANGES
                ? "rounded-2xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.05)]"
                : budget.status === BudgetStatus.SENT
                  ? "rounded-2xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.05)]"
                  : "rounded-2xl"
        }
      >
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
                {budget.insuranceCase ? "Enviar a liquidadora" : "Enviar al cliente"}
              </Button>
            ) : null}
          </div>

          <FormMessage
            message={transitionState.error ?? transitionState.success}
            tone={transitionState.success ? "success" : "error"}
          />
        </form>

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

      <form
        action={formAction}
        className="space-y-6"
        onChangeCapture={() => setPreviewVersion((current) => current + 1)}
        onInputCapture={() => setPreviewVersion((current) => current + 1)}
        ref={formRef}
      >
        <Card className="rounded-2xl">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="title"
              >
                Titulo
              </label>
              <Input defaultValue={budget.title} disabled={!isDraft} id="title" name="title" />
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
                disabled={!isDraft}
                id="summary"
                name="summary"
              />
            </div>
          </div>
        </Card>

        <CommercialSummaryCard
          defaultDiscountAmount={budget.discountAmount}
          defaultMarginPct={budget.workshopMarginPct}
          editable={isDraft}
          preview={preview}
        />

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
                      disabled={!isDraft}
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
                    disabled={!isDraft}
                    id={`lineQty:${item.id}`}
                    min="1"
                    name={`lineQty:${item.id}`}
                    type="number"
                  />
                  <p className="text-xs text-[color:var(--muted)]">Editable en borrador</p>
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
                    disabled={!isDraft}
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
        {isDraft ? (
          <SubmitButton label="Guardar ajustes del borrador" pendingLabel="Actualizando..." />
        ) : null}
      </form>
    </div>
  );
}
