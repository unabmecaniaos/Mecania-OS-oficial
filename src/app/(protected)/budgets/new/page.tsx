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
import { getInsuranceCasePhotoViewUrl } from "@/modules/insurance-cases/insurance-case.routes";

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
        <Card className="overflow-hidden border-[#18365f] bg-[linear-gradient(135deg,#0f2746_0%,#173b69_55%,#1f56a4_100%)] text-white shadow-[0_24px_56px_rgba(15,23,42,0.22)]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#9ec1ff]">
                  Nuevo presupuesto
                </p>
                <h1 className="mt-3 font-heading text-3xl font-semibold text-white sm:text-4xl">
                  Presupuesto para cliente liquidadora
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-[#dbe7fb] sm:text-base">
                  Consolida referencias, contexto del siniestro y abastecimiento del taller en una
                  sola vista operativa.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeroStat dark label="Casos liquidadora" value={context.insuranceCases.length} />
                <HeroStat dark label="Repuestos catalogados" value={context.inventoryParts.length} />
                <HeroStat dark label="Referencias" value={context.references.length} />
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
            vehicleId: insuranceCase.vehicle.id,
            vehicleName: `${insuranceCase.vehicle.make} ${insuranceCase.vehicle.model}`,
            vehicleLabel: `${insuranceCase.vehicle.make} ${insuranceCase.vehicle.model} / ${insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}`,
            vehicleIdentifier: insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin,
            vehicleVin: insuranceCase.vehicle.vin,
            liquidatorName: insuranceCase.liquidator.name,
            hasInitialPhotos: insuranceCase.photos.length > 0,
            initialPhotos: insuranceCase.photos.map((photo) => ({
              id: photo.id,
              fileName: photo.fileName,
              photoUrl: getInsuranceCasePhotoViewUrl(photo.id),
            })),
          }))}
          inventoryParts={context.inventoryParts.map((repuesto) => ({
            id: repuesto.id,
            name: repuesto.name,
            code: repuesto.code,
            unitPrice: repuesto.unitPrice,
            currentStock: repuesto.currentStock,
            minimumStock: repuesto.minimumStock,
            compatibleVehicleIds: repuesto.compatibleVehicles.map(
              (compatibility) => compatibility.vehicleId,
            ),
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
      <Card className="overflow-hidden border-[#18365f] bg-[linear-gradient(135deg,#0f2746_0%,#173b69_55%,#1f56a4_100%)] text-white shadow-[0_24px_56px_rgba(15,23,42,0.22)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#9ec1ff]">
                Nuevo presupuesto
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold text-white sm:text-4xl">
                Presupuesto para cliente taller
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#dbe7fb] sm:text-base">
                Disena presupuestos con compatibilidad VIN, stock real y una ruta clara de compra
                externa cuando el taller no tenga el repuesto.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <HeroStat dark label="Clientes taller" value={context.clients.length} />
              <HeroStat dark label="Autoinspecciones" value={context.selfInspections.length} />
              <HeroStat dark label="Repuestos catalogados" value={context.inventoryParts.length} />
              <HeroStat dark label="Referencias" value={context.references.length} />
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
          compatibleVehicleIds: repuesto.compatibleVehicles.map(
            (compatibility) => compatibility.vehicleId,
          ),
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
          ? "border-white/15 bg-white/12 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
          : "border-white/10 bg-white/5 text-[#dbe7fb] hover:border-white/20 hover:bg-white/10 hover:text-white",
      )}
      href={`/budgets/new?kind=${kind}`}
    >
      {label}
    </Link>
  );
}

function HeroStat({ label, value, dark = false }: { label: string; value: number; dark?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 shadow-[0_10px_24px_rgba(37,99,235,0.06)]",
        dark
          ? "border-white/10 bg-white/10 shadow-[0_18px_36px_rgba(10,18,38,0.14)]"
          : "border-[rgba(37,99,235,0.12)] bg-white/80",
      )}
    >
      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.18em]",
          dark ? "text-[#9ec1ff]" : "text-[color:var(--muted)]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-heading text-3xl font-semibold",
          dark ? "text-white" : "text-[color:var(--foreground)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
