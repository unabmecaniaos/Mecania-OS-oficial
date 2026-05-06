"use client";

import { BudgetItemType } from "@prisma/client";
import { ChangeEvent, useActionState, useMemo, useState } from "react";

import {
  createLiquidatorBudgetDraftAction,
  createWorkshopBudgetDraftAction,
} from "@/app/(protected)/budgets/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { formatCurrency } from "@/lib/utils";
import { BUDGET_ITEM_TYPE_LABELS } from "@/modules/budgets/budget.constants";

type ReferenceOption = {
  id: string;
  itemType: BudgetItemType;
  name: string;
  referenceCode: string | null;
  unitPrice: number;
  sourceLabel: string;
  sourceUrl: string | null;
  vehicleCompatibility: string | null;
};

type InventoryPartOption = {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
};

type WorkshopBudgetCreateFormProps = {
  clients: Array<{
    id: string;
    fullName: string;
  }>;
  selfInspections: Array<{
    id: string;
    customerId: string;
    customerName: string;
    vehicleId: string | null;
    vehicleLabel: string;
  }>;
  vehicles: Array<{
    id: string;
    plate: string | null;
    vin: string;
    make: string;
    model: string;
    clientId: string;
  }>;
  inventoryParts: InventoryPartOption[];
  references: ReferenceOption[];
  defaultClientId?: string;
  defaultSelfInspectionId?: string;
};

type LiquidatorBudgetCreateFormProps = {
  insuranceCases: Array<{
    id: string;
    caseNumber: string;
    ownerFullName: string;
    ownerPhone: string;
    ownerEmail: string | null;
    ownerAddress: string | null;
    claimNumber: string | null;
    policyNumber: string | null;
    incidentDateLabel: string;
    incidentLocation: string | null;
    description: string;
    vehicleName: string;
    vehicleLabel: string;
    vehicleIdentifier: string;
    liquidatorName: string;
    hasInitialPhotos: boolean;
  }>;
  inventoryParts: InventoryPartOption[];
  references: ReferenceOption[];
  defaultInsuranceCaseId?: string;
};

export function WorkshopBudgetCreateForm({
  clients,
  selfInspections,
  vehicles,
  inventoryParts,
  references,
  defaultClientId,
  defaultSelfInspectionId,
}: WorkshopBudgetCreateFormProps) {
  const [state, formAction] = useActionState(
    createWorkshopBudgetDraftAction,
    initialActionState,
  );
  const initialInspection = selfInspections.find(
    (inspection) => inspection.id === defaultSelfInspectionId,
  );
  const [selectedSelfInspectionId, setSelectedSelfInspectionId] = useState(
    defaultSelfInspectionId ?? "",
  );
  const [selectedClientId, setSelectedClientId] = useState(
    initialInspection?.customerId ?? defaultClientId ?? "",
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    initialInspection?.vehicleId ?? "",
  );
  const selectedInspection = selfInspections.find(
    (inspection) => inspection.id === selectedSelfInspectionId,
  );
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const availableVehicles = selectedClientId
    ? vehicles.filter((vehicle) => vehicle.clientId === selectedClientId)
    : [];

  function handleClientChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextClientId = event.target.value;
    setSelectedSelfInspectionId("");
    setSelectedClientId(nextClientId);

    const currentVehicleBelongsToNextClient = vehicles.some(
      (vehicle) => vehicle.id === selectedVehicleId && vehicle.clientId === nextClientId,
    );

    if (!nextClientId || !currentVehicleBelongsToNextClient) {
      setSelectedVehicleId("");
    }
  }

  function handleSelfInspectionChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextInspectionId = event.target.value;
    setSelectedSelfInspectionId(nextInspectionId);

    const inspection = selfInspections.find((entry) => entry.id === nextInspectionId);

    if (!inspection) {
      setSelectedClientId(defaultClientId ?? "");
      setSelectedVehicleId("");
      return;
    }

    setSelectedClientId(inspection.customerId);
    setSelectedVehicleId(inspection.vehicleId ?? "");
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="clientId" type="hidden" value={selectedClientId} />
      <input name="vehicleId" type="hidden" value={selectedVehicleId} />

      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,254,0.96))]">
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectionStat label="Cliente taller" value={selectedClient?.fullName ?? "Pendiente"} />
            <SelectionStat
              label="Vehiculo"
              value={
                selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : "Pendiente"
              }
            />
            <SelectionStat
              label="Origen"
              value={selectedInspection ? "Autoinspeccion revisada" : "Registro manual"}
            />
            <SelectionStat label="Contexto" value={selectedInspection ? "Autocompletado" : "Editable"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <SectionHeading eyebrow="Contexto del cliente taller" title="Origen y vinculacion" />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="selfInspectionId"
              >
                Autoinspeccion revisada
              </label>
              <Select
                id="selfInspectionId"
                name="selfInspectionId"
                onChange={handleSelfInspectionChange}
                value={selectedSelfInspectionId}
              >
                <option value="">Sin autoinspeccion asociada</option>
                {selfInspections.map((inspection) => (
                  <option key={inspection.id} value={inspection.id}>
                    {inspection.customerName} / {inspection.vehicleLabel}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="title">
                Titulo del presupuesto
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Ej. Reparacion frenos delanteros y mantencion"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="clientId">
                Cliente taller
              </label>
              <Select
                disabled={Boolean(selectedInspection)}
                id="clientId"
                onChange={handleClientChange}
                value={selectedClientId}
              >
                <option value="">Selecciona un cliente del taller</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="vehicleId">
                Vehiculo
              </label>
              <Select
                disabled={!selectedClientId || Boolean(selectedInspection)}
                id="vehicleId"
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                value={selectedVehicleId}
              >
                <option value="">
                  {selectedClientId
                    ? "Selecciona un vehiculo del cliente"
                    : "Selecciona primero un cliente"}
                </option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} / {vehicle.plate ?? vehicle.vin}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="summary">
                Resumen tecnico
              </label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Describe el motivo del presupuesto, el diagnostico base y cualquier alcance relevante."
              />
            </div>
          </div>
        </div>
      </Card>

      <BudgetItemsBuilder inventoryParts={inventoryParts} references={references} />
      <BudgetSubmitCard
        error={state.error}
        heading="Presupuesto de cliente taller listo para continuar"
        submitLabel="Crear presupuesto taller"
      />
    </form>
  );
}

export function LiquidatorBudgetCreateForm({
  insuranceCases,
  inventoryParts,
  references,
  defaultInsuranceCaseId,
}: LiquidatorBudgetCreateFormProps) {
  const [state, formAction] = useActionState(
    createLiquidatorBudgetDraftAction,
    initialActionState,
  );
  const [selectedInsuranceCaseId, setSelectedInsuranceCaseId] = useState(
    defaultInsuranceCaseId ?? "",
  );
  const selectedInsuranceCase = insuranceCases.find(
    (insuranceCase) => insuranceCase.id === selectedInsuranceCaseId,
  );
  const [title, setTitle] = useState(
    selectedInsuranceCase ? buildLiquidatorBudgetTitle(selectedInsuranceCase) : "",
  );
  const [summary, setSummary] = useState(
    selectedInsuranceCase ? buildLiquidatorBudgetSummary(selectedInsuranceCase) : "",
  );

  function handleInsuranceCaseChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextInsuranceCaseId = event.target.value;
    const nextInsuranceCase = insuranceCases.find(
      (insuranceCase) => insuranceCase.id === nextInsuranceCaseId,
    );

    setSelectedInsuranceCaseId(nextInsuranceCaseId);

    if (!nextInsuranceCase) {
      setTitle("");
      setSummary("");
      return;
    }

    setTitle(buildLiquidatorBudgetTitle(nextInsuranceCase));
    setSummary(buildLiquidatorBudgetSummary(nextInsuranceCase));
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,254,0.96))]">
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectionStat
              label="Titular"
              value={selectedInsuranceCase?.ownerFullName ?? "Selecciona un caso"}
            />
            <SelectionStat
              label="Liquidadora"
              value={selectedInsuranceCase?.liquidatorName ?? "Pendiente"}
            />
            <SelectionStat
              label="Vehiculo"
              value={selectedInsuranceCase?.vehicleName ?? "Pendiente"}
            />
            <SelectionStat
              label="Caso"
              value={selectedInsuranceCase?.caseNumber ?? "Sin vincular"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <SectionHeading
                eyebrow="Contexto del cliente liquidadora"
                title="Caso y contexto autocompletado"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="insuranceCaseId"
              >
                Caso de liquidadora
              </label>
              <Select
                id="insuranceCaseId"
                name="insuranceCaseId"
                onChange={handleInsuranceCaseChange}
                value={selectedInsuranceCaseId}
              >
                <option value="">Selecciona un caso de liquidadora</option>
                {insuranceCases.map((insuranceCase) => (
                  <option key={insuranceCase.id} value={insuranceCase.id}>
                    {insuranceCase.caseNumber} / {insuranceCase.vehicleLabel} /{" "}
                    {insuranceCase.liquidatorName}
                  </option>
                ))}
              </Select>
            </div>

            <ReadonlyContextCard
              label="Titular"
              value={selectedInsuranceCase?.ownerFullName ?? "Pendiente"}
            />
            <ReadonlyContextCard
              label="Contacto"
              value={selectedInsuranceCase?.ownerPhone ?? "Pendiente"}
            />
            <ReadonlyContextCard
              label="Vehiculo"
              value={selectedInsuranceCase?.vehicleLabel ?? "Pendiente"}
            />
            <ReadonlyContextCard
              label="Liquidadora"
              value={selectedInsuranceCase?.liquidatorName ?? "Pendiente"}
            />
            <ReadonlyContextCard
              label="Siniestro"
              value={selectedInsuranceCase?.claimNumber ?? "Sin numero informado"}
            />
            <ReadonlyContextCard
              label="Poliza"
              value={selectedInsuranceCase?.policyNumber ?? "Sin poliza informada"}
            />
            <ReadonlyContextCard
              label="Fecha del choque"
              value={selectedInsuranceCase?.incidentDateLabel ?? "Pendiente"}
            />
            <ReadonlyContextCard
              label="Lugar"
              value={selectedInsuranceCase?.incidentLocation ?? "Sin ubicacion informada"}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="title">
                Titulo del presupuesto
              </label>
              <Input
                id="title"
                name="title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Titulo del presupuesto"
                value={title}
              />
            </div>

            <div className="rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.05)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Evidencia inicial
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                {selectedInsuranceCase
                  ? selectedInsuranceCase.hasInitialPhotos
                    ? "Fotos iniciales cargadas por liquidadora"
                    : "Caso sin fotos iniciales"
                  : "Selecciona un caso para ver el estado"}
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="summary">
                Resumen tecnico inicial
              </label>
              <Textarea
                id="summary"
                name="summary"
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Resumen tecnico inicial"
                value={summary}
              />
            </div>
          </div>
        </div>
      </Card>

      <BudgetItemsBuilder inventoryParts={inventoryParts} references={references} />
      <BudgetSubmitCard
        error={state.error}
        heading="Presupuesto de cliente liquidadora listo para revision"
        submitLabel="Crear presupuesto liquidadora"
      />
    </form>
  );
}

function buildLiquidatorBudgetTitle(insuranceCase: LiquidatorBudgetCreateFormProps["insuranceCases"][number]) {
  return `Presupuesto ${insuranceCase.vehicleName} ${insuranceCase.vehicleIdentifier}`;
}

function buildLiquidatorBudgetSummary(
  insuranceCase: LiquidatorBudgetCreateFormProps["insuranceCases"][number],
) {
  return [
    `Caso ${insuranceCase.caseNumber}`,
    `Liquidadora: ${insuranceCase.liquidatorName}`,
    `Titular: ${insuranceCase.ownerFullName}`,
    `Vehiculo: ${insuranceCase.vehicleLabel}`,
    insuranceCase.claimNumber ? `Numero de siniestro: ${insuranceCase.claimNumber}` : null,
    insuranceCase.policyNumber ? `Poliza: ${insuranceCase.policyNumber}` : null,
    `Fecha del choque: ${insuranceCase.incidentDateLabel}`,
    insuranceCase.incidentLocation ? `Lugar: ${insuranceCase.incidentLocation}` : null,
    insuranceCase.ownerEmail ? `Correo del titular: ${insuranceCase.ownerEmail}` : null,
    insuranceCase.ownerAddress ? `Direccion: ${insuranceCase.ownerAddress}` : null,
    "",
    `Danos reportados por liquidadora: ${insuranceCase.description}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function BudgetItemsBuilder({
  inventoryParts,
  references,
}: {
  inventoryParts: InventoryPartOption[];
  references: ReferenceOption[];
}) {
  const manualSlots = [1, 2] as const;
  const partSlots = [1, 2, 3, 4] as const;
  const laborSlots = [1, 2, 3] as const;
  const supplySlots = [1, 2] as const;
  const [selectedPartIds, setSelectedPartIds] = useState<Record<string, string>>({});
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<Record<string, string>>({});
  const [visiblePartSlots, setVisiblePartSlots] = useState(1);
  const [visibleLaborSlots, setVisibleLaborSlots] = useState(1);
  const [visibleSupplySlots, setVisibleSupplySlots] = useState(1);
  const [showPartManual, setShowPartManual] = useState(false);
  const [showLaborManual, setShowLaborManual] = useState(false);
  const [showSupplyManual, setShowSupplyManual] = useState(false);
  const [visiblePartManualSlots, setVisiblePartManualSlots] = useState(1);
  const [visibleLaborManualSlots, setVisibleLaborManualSlots] = useState(1);
  const [visibleSupplyManualSlots, setVisibleSupplyManualSlots] = useState(1);

  const groupedReferences = useMemo(
    () => ({
      [BudgetItemType.LABOR]: references.filter(
        (reference) => reference.itemType === BudgetItemType.LABOR,
      ),
      [BudgetItemType.SUPPLY]: references.filter(
        (reference) => reference.itemType === BudgetItemType.SUPPLY,
      ),
    }),
    [references],
  );

  function findSelectedPart(slot: number) {
    return inventoryParts.find((part) => part.id === selectedPartIds[String(slot)]);
  }

  function findSelectedReference(type: "LABOR" | "SUPPLY", slot: number) {
    return groupedReferences[type]?.find(
      (reference) => reference.id === selectedReferenceIds[`${type}:${slot}`],
    );
  }

  return (
    <>
      <Card className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,254,0.96))]">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Repuestos conectados a inventario"
            title={BUDGET_ITEM_TYPE_LABELS[BudgetItemType.PART]}
          />

          <div className="space-y-4">
            {partSlots.slice(0, visiblePartSlots).map((slot) => {
              const selectedPart = findSelectedPart(slot);

              return (
                <div
                  className="grid gap-4 rounded-2xl border border-[rgba(37,99,235,0.10)] bg-white/95 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] lg:grid-cols-[1.8fr_180px_140px]"
                  key={`part-slot-${slot}`}
                >
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-[color:var(--muted-strong)]"
                      htmlFor={`partItem:${slot}`}
                    >
                      Repuesto
                    </label>
                    <Select
                      id={`partItem:${slot}`}
                      name={`partItem:${slot}`}
                      onChange={(event) =>
                        setSelectedPartIds((current) => ({
                          ...current,
                          [String(slot)]: event.target.value,
                        }))
                      }
                      value={selectedPartIds[String(slot)] ?? ""}
                    >
                      <option value="">Selecciona un repuesto</option>
                      {inventoryParts.map((part) => (
                        <option key={part.id} value={part.id}>
                          {part.name} / {part.code} / {formatCurrency(part.unitPrice)} / stock{" "}
                          {part.currentStock}
                        </option>
                      ))}
                    </Select>
                    {selectedPart ? (
                      <p className="text-sm text-[color:var(--muted)]">
                        Stock actual {selectedPart.currentStock} / minimo {selectedPart.minimumStock}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-[color:var(--muted-strong)]"
                      htmlFor={`partPriceDisplay:${slot}`}
                    >
                      Valor unitario
                    </label>
                    <Input
                      id={`partPriceDisplay:${slot}`}
                      readOnly
                      value={selectedPart ? String(selectedPart.unitPrice) : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-[color:var(--muted-strong)]"
                      htmlFor={`partQuantity:${slot}`}
                    >
                      Cantidad
                    </label>
                    <Input
                      defaultValue="0"
                      id={`partQuantity:${slot}`}
                      min="0"
                      name={`partQuantity:${slot}`}
                      type="number"
                    />
                  </div>
                </div>
              );
            })}

            {visiblePartSlots < partSlots.length ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => setVisiblePartSlots((current) => Math.min(current + 1, partSlots.length))}
                type="button"
                variant="secondary"
              >
                Agregar otro repuesto
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {([BudgetItemType.LABOR, BudgetItemType.SUPPLY] as const).map((type) => {
        const slots = type === BudgetItemType.LABOR ? laborSlots : supplySlots;
        const visibleSlots = type === BudgetItemType.LABOR ? visibleLaborSlots : visibleSupplySlots;
        const showManual = type === BudgetItemType.LABOR ? showLaborManual : showSupplyManual;
        const visibleManualSlots =
          type === BudgetItemType.LABOR ? visibleLaborManualSlots : visibleSupplyManualSlots;

        return (
          <Card
            className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,254,0.96))]"
            key={type}
          >
            <div className="space-y-4">
              <SectionHeading eyebrow="Catalogo referencial" title={BUDGET_ITEM_TYPE_LABELS[type]} />

              {groupedReferences[type].length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  No hay items cargados en esta categoria.
                </div>
              ) : (
                <div className="space-y-4">
                  {slots.slice(0, visibleSlots).map((slot) => {
                    const selectedReference = findSelectedReference(type, slot);

                    return (
                      <div
                        className="grid gap-4 rounded-2xl border border-[rgba(37,99,235,0.10)] bg-white/95 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] lg:grid-cols-[1.8fr_180px_140px]"
                        key={`${type}-slot-${slot}`}
                      >
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-[color:var(--muted-strong)]"
                            htmlFor={`referenceItem:${type}:${slot}`}
                          >
                            {BUDGET_ITEM_TYPE_LABELS[type]}
                          </label>
                          <Select
                            id={`referenceItem:${type}:${slot}`}
                            name={`referenceItem:${type}:${slot}`}
                            onChange={(event) =>
                              setSelectedReferenceIds((current) => ({
                                ...current,
                                [`${type}:${slot}`]: event.target.value,
                              }))
                            }
                            value={selectedReferenceIds[`${type}:${slot}`] ?? ""}
                          >
                            <option value="">Selecciona una referencia</option>
                            {groupedReferences[type].map((reference) => (
                              <option key={reference.id} value={reference.id}>
                                {reference.name} / {reference.referenceCode ?? "sin codigo"} /{" "}
                                {formatCurrency(reference.unitPrice)}
                              </option>
                            ))}
                          </Select>
                          {selectedReference?.vehicleCompatibility ? (
                            <p className="text-sm text-[color:var(--muted)]">
                              Aplicacion: {selectedReference.vehicleCompatibility}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-[color:var(--muted-strong)]"
                            htmlFor={`referencePriceDisplay:${type}:${slot}`}
                          >
                            Valor unitario
                          </label>
                          <Input
                            id={`referencePriceDisplay:${type}:${slot}`}
                            readOnly
                            value={selectedReference ? String(selectedReference.unitPrice) : ""}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-[color:var(--muted-strong)]"
                            htmlFor={`referenceQuantity:${type}:${slot}`}
                          >
                            Cantidad
                          </label>
                          <Input
                            defaultValue="0"
                            id={`referenceQuantity:${type}:${slot}`}
                            min="0"
                            name={`referenceQuantity:${type}:${slot}`}
                            type="number"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {visibleSlots < slots.length ? (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (type === BudgetItemType.LABOR) {
                          setVisibleLaborSlots((current) => Math.min(current + 1, laborSlots.length));
                          return;
                        }

                        setVisibleSupplySlots((current) => Math.min(current + 1, supplySlots.length));
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Agregar otro {type === BudgetItemType.LABOR ? "item de mano de obra" : "suministro"}
                    </Button>
                  ) : null}
                </div>
              )}

              {showManual ? (
                <ManualFallbackSection
                  itemType={type}
                  manualSlots={manualSlots.slice(0, visibleManualSlots)}
                  onAddMore={
                    visibleManualSlots < manualSlots.length
                      ? () => {
                          if (type === BudgetItemType.LABOR) {
                            setVisibleLaborManualSlots((current) =>
                              Math.min(current + 1, manualSlots.length),
                            );
                            return;
                          }

                          setVisibleSupplyManualSlots((current) =>
                            Math.min(current + 1, manualSlots.length),
                          );
                        }
                      : undefined
                  }
                  placeholderDescription={
                    type === BudgetItemType.LABOR
                      ? "Ej. Mano de obra cambio discos y rectificado"
                      : "Ej. Limpiador de frenos o insumo puntual"
                  }
                  placeholderNote="Ej. Valor conversado con proveedor o servicio puntual"
                  title={`${BUDGET_ITEM_TYPE_LABELS[type]} fuera del catalogo`}
                />
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (type === BudgetItemType.LABOR) {
                      setShowLaborManual(true);
                      return;
                    }

                    setShowSupplyManual(true);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Agregar {BUDGET_ITEM_TYPE_LABELS[type].toLowerCase()} manual
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      {showPartManual ? (
        <Card className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,254,0.96))]">
          <div className="space-y-4">
            <SectionHeading
              eyebrow="Respaldo manual"
              title={`${BUDGET_ITEM_TYPE_LABELS[BudgetItemType.PART]} fuera del inventario`}
            />

            <ManualFallbackRows
              itemType={BudgetItemType.PART}
              manualSlots={manualSlots.slice(0, visiblePartManualSlots)}
              onAddMore={
                visiblePartManualSlots < manualSlots.length
                  ? () =>
                      setVisiblePartManualSlots((current) =>
                        Math.min(current + 1, manualSlots.length),
                      )
                  : undefined
              }
              placeholderDescription="Ej. Pastillas Brembo delanteras"
              placeholderNote="Ej. Repuesto pendiente de cargar en inventario"
            />
          </div>
        </Card>
      ) : (
        <Button
          className="w-full sm:w-auto"
          onClick={() => setShowPartManual(true)}
          type="button"
          variant="secondary"
        >
          Agregar repuesto manual
        </Button>
      )}
    </>
  );
}

function BudgetSubmitCard({
  error,
  heading,
  submitLabel,
}: {
  error?: string;
  heading: string;
  submitLabel: string;
}) {
  return (
    <Card className="sticky bottom-4 rounded-2xl border-[rgba(37,99,235,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(239,246,255,0.96))] shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Guardado del borrador
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">{heading}</h2>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[280px]">
          <FormMessage message={error} />
          <SubmitButton className="w-full" label={submitLabel} pendingLabel="Creando presupuesto..." />
        </div>
      </div>
    </Card>
  );
}

function ReadonlyContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.05)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 min-h-[2.75rem] text-sm font-semibold leading-5 text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function ManualFallbackSection({
  itemType,
  manualSlots,
  onAddMore,
  placeholderDescription,
  placeholderNote,
  title,
}: {
  itemType: BudgetItemType;
  manualSlots: readonly number[];
  onAddMore?: () => void;
  placeholderDescription: string;
  placeholderNote: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(37,99,235,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,246,255,0.82))] p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Respaldo manual
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
      </div>

      <div className="mt-4">
        <ManualFallbackRows
          itemType={itemType}
          manualSlots={manualSlots}
          onAddMore={onAddMore}
          placeholderDescription={placeholderDescription}
          placeholderNote={placeholderNote}
        />
      </div>
    </div>
  );
}

function ManualFallbackRows({
  itemType,
  manualSlots,
  onAddMore,
  placeholderDescription,
  placeholderNote,
}: {
  itemType: BudgetItemType;
  manualSlots: readonly number[];
  onAddMore?: () => void;
  placeholderDescription: string;
  placeholderNote: string;
}) {
  return (
    <div className="space-y-4">
      {manualSlots.map((slot) => (
        <div
          className="grid gap-3 rounded-2xl border border-[rgba(37,99,235,0.10)] bg-white/95 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] lg:grid-cols-[2fr_140px_140px]"
          key={`${itemType}-${slot}`}
        >
          <div className="space-y-2 lg:col-span-3">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor={`manualDescription:${itemType}:${slot}`}
            >
              Descripcion manual
            </label>
            <Input
              id={`manualDescription:${itemType}:${slot}`}
              name={`manualDescription:${itemType}:${slot}`}
              placeholder={placeholderDescription}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor={`manualQuantity:${itemType}:${slot}`}
            >
              Cantidad
            </label>
            <Input
              defaultValue="0"
              id={`manualQuantity:${itemType}:${slot}`}
              min="0"
              name={`manualQuantity:${itemType}:${slot}`}
              type="number"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor={`manualPrice:${itemType}:${slot}`}
            >
              Valor unitario
            </label>
            <Input
              defaultValue="0"
              id={`manualPrice:${itemType}:${slot}`}
              min="0"
              name={`manualPrice:${itemType}:${slot}`}
              type="number"
            />
          </div>

          <div className="space-y-2 lg:col-span-3">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor={`manualNote:${itemType}:${slot}`}
            >
              Nota opcional
            </label>
            <Input
              id={`manualNote:${itemType}:${slot}`}
              name={`manualNote:${itemType}:${slot}`}
              placeholder={placeholderNote}
            />
          </div>
        </div>
      ))}

      {onAddMore ? (
        <Button className="w-full sm:w-auto" onClick={onAddMore} type="button" variant="secondary">
          Agregar otro item manual
        </Button>
      ) : null}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
        {title}
      </h2>
    </div>
  );
}

function SelectionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(37,99,235,0.12)] bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.05)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 min-h-[2.75rem] text-sm font-semibold leading-5 text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
