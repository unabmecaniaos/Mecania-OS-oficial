import Link from "next/link";

import {
  LiquidatorBudgetCreateForm,
  WorkshopBudgetCreateForm,
} from "@/app/(protected)/budgets/budget-create-form";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import {
  getLiquidatorBudgetCreateContext,
  getWorkshopBudgetCreateContext,
} from "@/modules/budgets/budget.service";

type BudgetFormKind = "workshop" | "liquidator";

function resolveBudgetFormKind(input?: string, insuranceCaseId?: string): BudgetFormKind {
  if (input === "liquidator" || insuranceCaseId) {
    return "liquidator";
  }

  return "workshop";
}

export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams?: Promise<{
    kind?: string;
    insuranceCaseId?: string;
    clientId?: string;
    selfInspectionId?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const kind = resolveBudgetFormKind(
    resolvedSearchParams?.kind,
    resolvedSearchParams?.insuranceCaseId,
  );

  if (kind === "liquidator") {
    const context = await getLiquidatorBudgetCreateContext();

    return (
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Nuevo presupuesto
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">
                Presupuesto para cliente liquidadora
              </h1>
            </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeroStat label="Casos liquidadora" value={context.insuranceCases.length} />
                <HeroStat label="Repuestos catalogados" value={context.inventoryParts.length} />
                <HeroStat label="Referencias" value={context.references.length} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <BudgetFormLink kind="workshop" label="Formulario taller" />
              <BudgetFormLink kind="liquidator" label="Formulario liquidadora" selected />
            </div>

          </div>
        </Card>

        <LiquidatorBudgetCreateForm
          defaultInsuranceCaseId={resolvedSearchParams?.insuranceCaseId}
          insuranceCases={context.insuranceCases.map((insuranceCase) => ({
            id: insuranceCase.id,
            caseNumber: insuranceCase.caseNumber,
            ownerFullName: insuranceCase.ownerFullName,
            ownerPhone: insuranceCase.ownerPhone,
            ownerEmail: insuranceCase.ownerEmail ?? null,
            ownerAddress: insuranceCase.ownerAddress ?? null,
            claimNumber: insuranceCase.claimNumber ?? null,
            policyNumber: insuranceCase.policyNumber ?? null,
            incidentDateLabel: formatDate(insuranceCase.incidentDate),
            incidentLocation: insuranceCase.incidentLocation ?? null,
            description: insuranceCase.description,
            vehicleName: `${insuranceCase.vehicle.make} ${insuranceCase.vehicle.model}`,
            vehicleLabel: `${insuranceCase.vehicle.make} ${insuranceCase.vehicle.model} / ${insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}`,
            vehicleIdentifier: insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin,
            liquidatorName: insuranceCase.liquidator.name,
            hasInitialPhotos: insuranceCase.photos.length > 0,
          }))}
          inventoryParts={context.inventoryParts.map((repuesto) => ({
            id: repuesto.id,
            name: repuesto.name,
            code: repuesto.code,
            unitPrice: repuesto.unitPrice,
            currentStock: repuesto.currentStock,
            minimumStock: repuesto.minimumStock,
          }))}
          references={context.references.map((reference) => ({
            id: reference.id,
            itemType: reference.itemType,
            name: reference.name,
            referenceCode: reference.referenceCode,
            unitPrice: reference.unitPrice,
            sourceLabel: reference.sourceLabel,
            sourceUrl: reference.sourceUrl,
            vehicleCompatibility: reference.vehicleCompatibility,
          }))}
        />
      </div>
    );
  }

  const context = await getWorkshopBudgetCreateContext();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Nuevo presupuesto
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">
                Presupuesto para cliente taller
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <HeroStat label="Clientes taller" value={context.clients.length} />
              <HeroStat label="Autoinspecciones" value={context.selfInspections.length} />
              <HeroStat label="Repuestos catalogados" value={context.inventoryParts.length} />
              <HeroStat label="Referencias" value={context.references.length} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <BudgetFormLink kind="workshop" label="Formulario taller" selected />
            <BudgetFormLink kind="liquidator" label="Formulario liquidadora" />
          </div>

        </div>
      </Card>

      <WorkshopBudgetCreateForm
        clients={context.clients.map((client) => ({
          id: client.id,
          fullName: client.fullName,
        }))}
        defaultClientId={resolvedSearchParams?.clientId}
        defaultSelfInspectionId={resolvedSearchParams?.selfInspectionId}
        inventoryParts={context.inventoryParts.map((repuesto) => ({
          id: repuesto.id,
          name: repuesto.name,
          code: repuesto.code,
          unitPrice: repuesto.unitPrice,
          currentStock: repuesto.currentStock,
          minimumStock: repuesto.minimumStock,
        }))}
        references={context.references.map((reference) => ({
          id: reference.id,
          itemType: reference.itemType,
          name: reference.name,
          referenceCode: reference.referenceCode,
          unitPrice: reference.unitPrice,
          sourceLabel: reference.sourceLabel,
          sourceUrl: reference.sourceUrl,
          vehicleCompatibility: reference.vehicleCompatibility,
        }))}
        selfInspections={context.selfInspections.map((inspection) => ({
          id: inspection.id,
          customerId: inspection.customer.id,
          customerName: inspection.customer.fullName,
          vehicleId: inspection.vehicleId,
          vehicleLabel: inspection.vehicle
            ? `${inspection.vehicle.make} ${inspection.vehicle.model} / ${inspection.vehicle.plate ?? inspection.vehicle.vin}`
            : "Vehiculo pendiente",
        }))}
        vehicles={context.vehicles.map((vehicle) => ({
          id: vehicle.id,
          plate: vehicle.plate,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          clientId: vehicle.clientId,
        }))}
      />
    </div>
  );
}

function BudgetFormLink({
  kind,
  label,
  selected = false,
}: {
  kind: BudgetFormKind;
  label: string;
  selected?: boolean;
}) {
  return (
    <Link
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
        selected
          ? "border-[rgba(37,99,235,0.22)] bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(37,99,235,0.10))] text-[#1d4ed8] shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
          : "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.12)] hover:bg-[rgba(37,99,235,0.08)] hover:text-[#1d4ed8]",
      )}
      href={`/budgets/new?kind=${kind}`}
    >
      {label}
    </Link>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgba(37,99,235,0.12)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.06)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
