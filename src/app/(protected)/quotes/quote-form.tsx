"use client";

import { ChangeEvent, useActionState, useState } from "react";
import { QuoteItemType, QuoteRecipientType } from "@prisma/client";

import { createQuoteAction } from "@/app/(protected)/quotes/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { formatCurrency } from "@/lib/utils";
import {
  QUOTE_ITEM_TYPE_LABELS,
  QUOTE_ITEM_TYPE_OPTIONS,
  QUOTE_RECIPIENT_OPTIONS,
} from "@/modules/quotes/quote.constants";

type QuoteFormProps = {
  clients: Array<{
    id: string;
    fullName: string;
  }>;
  vehicles: Array<{
    id: string;
    clientId: string;
    label: string;
  }>;
  reviewedInspections: Array<{
    id: string;
    clientId: string;
    vehicleId: string | null;
    label: string;
  }>;
};

type QuoteItemDraft = {
  id: number;
  type: QuoteItemType;
  description: string;
  quantity: string;
  unitPrice: string;
};

function createItemDraft(id: number): QuoteItemDraft {
  return {
    id,
    type: QuoteItemType.LABOR,
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

export function QuoteForm({ clients, vehicles, reviewedInspections }: QuoteFormProps) {
  const [state, formAction] = useActionState(createQuoteAction, initialActionState);
  const [selectedInspectionId, setSelectedInspectionId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [nextItemId, setNextItemId] = useState(2);
  const [items, setItems] = useState<QuoteItemDraft[]>([createItemDraft(1)]);

  const selectedInspection = reviewedInspections.find(
    (inspection) => inspection.id === selectedInspectionId,
  );
  const effectiveClientId = selectedInspection?.clientId ?? selectedClientId;
  const effectiveVehicleId = selectedInspection?.vehicleId ?? selectedVehicleId;
  const availableVehicles = effectiveClientId
    ? vehicles.filter((vehicle) => vehicle.clientId === effectiveClientId)
    : [];
  const totalAmount = items.reduce((accumulator, item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return accumulator;
    }

    return accumulator + quantity * unitPrice;
  }, 0);

  function handleInspectionChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextInspectionId = event.target.value;
    setSelectedInspectionId(nextInspectionId);

    if (!nextInspectionId) {
      return;
    }

    const inspection = reviewedInspections.find((item) => item.id === nextInspectionId);

    if (!inspection) {
      return;
    }

    setSelectedClientId(inspection.clientId);
    setSelectedVehicleId(inspection.vehicleId ?? "");
  }

  function handleClientChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextClientId = event.target.value;
    setSelectedInspectionId("");
    setSelectedClientId(nextClientId);

    const currentVehicleBelongsToClient = vehicles.some(
      (vehicle) => vehicle.id === selectedVehicleId && vehicle.clientId === nextClientId,
    );

    if (!nextClientId || !currentVehicleBelongsToClient) {
      setSelectedVehicleId("");
    }
  }

  function updateItemDraft(id: number, field: keyof Omit<QuoteItemDraft, "id">, value: string) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createItemDraft(nextItemId)]);
    setNextItemId((currentValue) => currentValue + 1);
  }

  function removeItem(id: number) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems;
      }

      return currentItems.filter((item) => item.id !== id);
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-2 xl:col-span-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="selfInspectionId"
          >
            Autoinspeccion revisada
          </label>
          <Select
            id="selfInspectionId"
            name="selfInspectionId"
            onChange={handleInspectionChange}
            value={selectedInspectionId}
          >
            <option value="">Sin autoinspeccion revisada</option>
            {reviewedInspections.map((inspection) => (
              <option key={inspection.id} value={inspection.id}>
                {inspection.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-[color:var(--muted)]">
            Si la seleccionas, el cliente y vehiculo se completan desde una autoinspeccion ya
            revisada internamente.
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="recipientType"
          >
            Destino del presupuesto
          </label>
          <Select defaultValue={QuoteRecipientType.CUSTOMER} id="recipientType" name="recipientType">
            {QUOTE_RECIPIENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="clientId">
            Cliente
          </label>
          <Select
            disabled={Boolean(selectedInspectionId)}
            id="clientId"
            name="clientId"
            onChange={handleClientChange}
            value={effectiveClientId}
          >
            <option value="">
              {selectedInspectionId ? "Cliente resuelto desde la autoinspeccion" : "Selecciona un cliente"}
            </option>
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
            disabled={!effectiveClientId || Boolean(selectedInspectionId)}
            id="vehicleId"
            name="vehicleId"
            onChange={(event) => {
              setSelectedInspectionId("");
              setSelectedVehicleId(event.target.value);
            }}
            value={effectiveVehicleId}
          >
            <option value="">
              {selectedInspectionId
                ? "Vehiculo resuelto desde la autoinspeccion"
                : effectiveClientId
                  ? "Selecciona un vehiculo"
                  : "Selecciona primero un cliente"}
            </option>
            {availableVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="summary">
            Alcance general
          </label>
          <Textarea
            id="summary"
            name="summary"
            placeholder="Resume el trabajo propuesto, diagnostico o motivo general del presupuesto"
          />
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="internalNotes"
          >
            Notas internas
          </label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            placeholder="Observaciones para revision interna antes del envio"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Items del presupuesto</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Desglosa mano de obra, repuestos y suministros por separado.
            </p>
          </div>

          <Button onClick={addItem} type="button" variant="secondary">
            Agregar item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const lineTotal =
              Number.isFinite(Number(item.quantity)) && Number.isFinite(Number(item.unitPrice))
                ? Number(item.quantity) * Number(item.unitPrice)
                : 0;

            return (
              <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4" key={item.id}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.9fr_2fr_0.8fr_0.8fr]">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--muted-strong)]">
                        Tipo
                      </label>
                      <Select
                        name="itemType"
                        onChange={(event) => updateItemDraft(item.id, "type", event.target.value)}
                        value={item.type}
                      >
                        {QUOTE_ITEM_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2 xl:col-span-1">
                      <label className="text-sm font-medium text-[color:var(--muted-strong)]">
                        Descripcion
                      </label>
                      <Input
                        name="itemDescription"
                        onChange={(event) =>
                          updateItemDraft(item.id, "description", event.target.value)
                        }
                        placeholder={`Detalle de ${QUOTE_ITEM_TYPE_LABELS[item.type].toLowerCase()}`}
                        value={item.description}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--muted-strong)]">
                        Cantidad
                      </label>
                      <Input
                        min="0.01"
                        name="itemQuantity"
                        onChange={(event) => updateItemDraft(item.id, "quantity", event.target.value)}
                        step="0.01"
                        type="number"
                        value={item.quantity}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--muted-strong)]">
                        Valor unitario
                      </label>
                      <Input
                        min="0"
                        name="itemUnitPrice"
                        onChange={(event) => updateItemDraft(item.id, "unitPrice", event.target.value)}
                        step="0.01"
                        type="number"
                        value={item.unitPrice}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-[180px] flex-col justify-between gap-3 rounded-xl bg-[color:var(--surface-muted)] p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Item {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>

                    <Button
                      onClick={() => removeItem(item.id)}
                      type="button"
                      variant="ghost"
                    >
                      Quitar item
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.06)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">Total estimado</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-[#1d4ed8]">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      <FormMessage message={state.error} />
      <SubmitButton
        label="Guardar presupuesto en borrador"
        pendingLabel="Guardando presupuesto..."
      />
    </form>
  );
}
