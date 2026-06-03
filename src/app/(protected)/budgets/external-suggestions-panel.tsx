"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SuggestionResponse = {
  data?: {
    sourceNotice: string;
    selectedPart: {
      name: string | null;
      code: string | null;
    };
    decodedVehicle: {
      vin: string;
      make: string | null;
      model: string | null;
      year: string | null;
      vehicleType: string | null;
      bodyClass: string | null;
      engineModel: string | null;
      displacementL: string | null;
      errorText: string | null;
    };
    search: {
      strategy: "code-first" | "name-first";
      preferredQuery: string;
      codeQuery: string | null;
      descriptiveQuery: string | null;
      site: string;
    };
    purchaseLinks: Array<{
      label: string;
      query: string;
      description: string;
      url: string;
    }>;
    mercadoLibre: {
      status: "ok" | "missing-token" | "unavailable";
      message: string | null;
      items: Array<{
        id: string;
        title: string;
        price: number;
        currencyId: string;
        permalink: string;
        thumbnail: string | null;
        availableQuantity: number | null;
        condition: string | null;
      }>;
    };
  };
  error?: string;
};

type ExternalSuggestionsPanelProps = {
  defaultVin?: string;
  defaultPartName?: string;
  defaultPartCode?: string;
  selectedPartStock?: number | null;
};

export function ExternalSuggestionsPanel({
  defaultVin = "",
  defaultPartName = "",
  defaultPartCode = "",
  selectedPartStock = null,
}: ExternalSuggestionsPanelProps) {
  const [vin, setVin] = useState(defaultVin);
  const [query, setQuery] = useState(defaultPartName || "filtro aceite");
  const [partCode, setPartCode] = useState(defaultPartCode);
  const [result, setResult] = useState<SuggestionResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVin(defaultVin);
  }, [defaultVin]);

  useEffect(() => {
    setQuery(defaultPartName || "filtro aceite");
  }, [defaultPartName]);

  useEffect(() => {
    setPartCode(defaultPartCode);
  }, [defaultPartCode]);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({
      vin,
      query,
      partCode,
      limit: "8",
    });
    try {
      const response = await fetch(`/api/inventory/external-suggestions?${params.toString()}`);
      const payload = (await response.json()) as SuggestionResponse;

      if (!response.ok) {
        setError(payload.error ?? "No se pudieron obtener sugerencias externas");
        return;
      }

      setResult(payload.data ?? null);
    } catch {
      setError("No se pudo consultar sugerencias externas en este momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Repuesto no disponible en inventario
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">
          Buscar sugerencias externas por VIN
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
          Usa esta busqueda cuando el taller no tenga el repuesto necesario o el stock llegue a
          cero. NHTSA identifica el vehiculo y luego MecaniaOS arma busquedas listas para comprar,
          priorizando el codigo del repuesto cuando ya existe.
        </p>
      </div>

      {selectedPartStock !== null ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {selectedPartStock <= 0
            ? "El repuesto seleccionado esta sin stock. Usa estas busquedas para encontrar una compra externa."
            : `Stock actual del repuesto seleccionado: ${selectedPartStock}. Puedes usar estas busquedas para comparar proveedores.`}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="externalVin">
            VIN
          </label>
          <Input
            id="externalVin"
            onChange={(event) => setVin(event.target.value)}
            placeholder="Ej. 8AJBA3CD6N1234567"
            value={vin}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="externalPartCode"
          >
            Codigo del repuesto
          </label>
          <Input
            id="externalPartCode"
            onChange={(event) => setPartCode(event.target.value)}
            placeholder="Ej. 04465-0K390"
            value={partCode}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="externalQuery"
          >
            Repuesto a buscar
          </label>
          <Input
            id="externalQuery"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej. pastillas freno, filtro aceite"
            value={query}
          />
        </div>

        <div className="flex items-end">
          <Button disabled={loading} onClick={handleSearch} type="button">
            {loading ? "Buscando..." : "Buscar sugerencias"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] p-4 text-sm text-[#991b1b]">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <InfoTile label="VIN" value={result.decodedVehicle.vin} />
            <InfoTile
              label="Vehiculo NHTSA"
              value={[
                result.decodedVehicle.make,
                result.decodedVehicle.model,
                result.decodedVehicle.year,
              ]
                .filter(Boolean)
                .join(" ") || "Sin decodificar"}
            />
            <InfoTile label="Busqueda principal" value={result.search.preferredQuery} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <InfoTile
              label="Estrategia"
              value={result.search.strategy === "code-first" ? "Codigo primero" : "Nombre primero"}
            />
            <InfoTile label="Codigo" value={result.selectedPart.code ?? "Sin codigo"} />
            <InfoTile label="Repuesto" value={result.selectedPart.name ?? "Consulta manual"} />
          </div>

          <p className="text-sm text-[color:var(--muted-strong)]">{result.sourceNotice}</p>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              Links de compra y busqueda
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {result.purchaseLinks.map((link) => (
                <a
                  className="rounded-xl border border-[color:var(--border)] bg-white p-4 transition hover:border-[#2563eb]"
                  href={link.url}
                  key={`${link.label}-${link.query}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">{link.label}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted-strong)]">{link.query}</p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">{link.description}</p>
                </a>
              ))}
            </div>
          </div>

          {result.mercadoLibre.status !== "ok" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {result.mercadoLibre.message}
            </div>
          ) : null}

          {result.mercadoLibre.items.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {result.mercadoLibre.items.map((item) => (
                <a
                  className="flex gap-3 rounded-xl border border-[color:var(--border)] bg-white p-3 transition hover:border-[#2563eb]"
                  href={item.permalink}
                  key={item.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                      src={item.thumbnail}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                      {item.currencyId} {item.price.toLocaleString("es-CL")}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
