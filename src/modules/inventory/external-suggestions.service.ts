import { AppError } from "@/lib/errors";
import { normalizeVin, vinSchema } from "@/lib/vin";

type NhtsaDecodeResult = {
  VIN?: string;
  Make?: string;
  Model?: string;
  ModelYear?: string;
  VehicleType?: string;
  BodyClass?: string;
  EngineModel?: string;
  DisplacementL?: string;
  ErrorCode?: string;
  ErrorText?: string;
};

type NhtsaResponse = {
  Results?: NhtsaDecodeResult[];
};

type MercadoLibreItem = {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  permalink: string;
  thumbnail?: string;
  available_quantity?: number;
  condition?: string;
};

type MercadoLibreResponse = {
  results?: MercadoLibreItem[];
};

type ExternalPartSuggestionsInput = {
  vin: string;
  query?: string;
  partCode?: string;
  limit?: number;
};

type PurchaseLink = {
  label: string;
  query: string;
  description: string;
  url: string;
};

function normalizeSearchTerm(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function slugifyMercadoLibreQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMercadoLibreQuery(input: {
  query?: string;
  make?: string | null;
  model?: string | null;
  year?: string | null;
}) {
  return [input.query, input.make, input.model, input.year]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMercadoLibreUrl(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  const slug = slugifyMercadoLibreQuery(normalizedQuery);
  const encodedQuery = encodeURIComponent(normalizedQuery);

  return `https://listado.mercadolibre.cl/${slug}#D[A:${encodedQuery}]`;
}

function buildGoogleUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function pushPurchaseLink(
  target: PurchaseLink[],
  existingQueries: Set<string>,
  link: PurchaseLink | null,
) {
  if (!link) {
    return;
  }

  const normalizedQuery = normalizeSearchTerm(link.query).toLowerCase();

  if (!normalizedQuery || existingQueries.has(normalizedQuery)) {
    return;
  }

  existingQueries.add(normalizedQuery);
  target.push(link);
}

async function decodeVinWithNhtsa(vin: string) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(
    vin,
  )}?format=json`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MecaniaOS-local-vin-prototype/1.0",
    },
  });

  if (!response.ok) {
    throw new AppError("NHTSA no respondio correctamente al decodificar el VIN", 502);
  }

  const payload = (await response.json()) as NhtsaResponse;
  const decoded = payload.Results?.[0] ?? {};

  return {
    vin: normalizeVin(decoded.VIN ?? vin),
    make: decoded.Make || null,
    model: decoded.Model || null,
    year: decoded.ModelYear || null,
    vehicleType: decoded.VehicleType || null,
    bodyClass: decoded.BodyClass || null,
    engineModel: decoded.EngineModel || null,
    displacementL: decoded.DisplacementL || null,
    errorCode: decoded.ErrorCode || null,
    errorText: decoded.ErrorText || null,
  };
}

async function searchMercadoLibre(input: { query: string; limit: number }) {
  const accessToken = process.env.MERCADOLIBRE_ACCESS_TOKEN ?? process.env.ML_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      status: "missing-token" as const,
      message:
        "No hay token de Mercado Libre en este entorno. Aun asi puedes usar los links directos de compra y busqueda.",
      items: [],
    };
  }

  const url = new URL("https://api.mercadolibre.com/sites/MLC/search");
  url.searchParams.set("q", input.query);
  url.searchParams.set("limit", String(input.limit));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "MecaniaOS-local-vin-prototype/1.0",
    },
  });

  if (!response.ok) {
    return {
      status: "unavailable" as const,
      message: `Mercado Libre respondio con estado ${response.status}.`,
      items: [],
    };
  }

  const payload = (await response.json()) as MercadoLibreResponse;

  return {
    status: "ok" as const,
    message: null,
    items: (payload.results ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currencyId: item.currency_id,
      permalink: item.permalink,
      thumbnail: item.thumbnail ?? null,
      availableQuantity: item.available_quantity ?? null,
      condition: item.condition ?? null,
    })),
  };
}

export async function getExternalPartSuggestions(input: ExternalPartSuggestionsInput) {
  const vin = vinSchema.parse(input.vin);
  const decodedVehicle = await decodeVinWithNhtsa(vin);
  const partName = normalizeSearchTerm(input.query);
  const partCode = normalizeSearchTerm(input.partCode);
  const descriptiveQuery = buildMercadoLibreQuery({
    query: input.query,
    make: decodedVehicle.make,
    model: decodedVehicle.model,
    year: decodedVehicle.year,
  });
  const codeOnlyQuery = partCode;
  const codeWithVehicleQuery = buildMercadoLibreQuery({
    query: [partCode, partName].filter(Boolean).join(" "),
    make: decodedVehicle.make,
    model: decodedVehicle.model,
    year: decodedVehicle.year,
  });
  const preferredQuery = codeWithVehicleQuery || descriptiveQuery || codeOnlyQuery;

  if (!preferredQuery) {
    throw new AppError("Ingresa un repuesto o selecciona uno con codigo para buscar sugerencias", 422);
  }

  const mercadoLibre = await searchMercadoLibre({
    query: preferredQuery,
    limit: Math.min(Math.max(input.limit ?? 8, 1), 20),
  });
  const purchaseLinks: PurchaseLink[] = [];
  const existingQueries = new Set<string>();

  pushPurchaseLink(purchaseLinks, existingQueries, codeOnlyQuery
    ? {
        label: "Buscar codigo en Mercado Libre",
        query: codeOnlyQuery,
        description: "Prioriza coincidencias exactas cuando el repuesto ya tiene codigo registrado.",
        url: buildMercadoLibreUrl(codeOnlyQuery),
      }
    : null);
  pushPurchaseLink(purchaseLinks, existingQueries, codeWithVehicleQuery
    ? {
        label: "Buscar codigo con vehiculo",
        query: codeWithVehicleQuery,
        description: "Combina codigo, nombre y contexto del vehiculo para reducir resultados ambiguos.",
        url: buildMercadoLibreUrl(codeWithVehicleQuery),
      }
    : null);
  pushPurchaseLink(purchaseLinks, existingQueries, descriptiveQuery
    ? {
        label: "Buscar nombre en Mercado Libre",
        query: descriptiveQuery,
        description: "Sirve como respaldo cuando no existe codigo exacto del repuesto.",
        url: buildMercadoLibreUrl(descriptiveQuery),
      }
    : null);
  pushPurchaseLink(purchaseLinks, existingQueries, codeOnlyQuery
    ? {
        label: "Buscar codigo en Google",
        query: codeOnlyQuery,
        description: "Abre resultados externos para encontrar proveedores fuera de Mercado Libre.",
        url: buildGoogleUrl(`${codeOnlyQuery} repuesto chile`),
      }
    : null);
  pushPurchaseLink(purchaseLinks, existingQueries, preferredQuery
    ? {
        label: "Buscar repuesto en Google",
        query: preferredQuery,
        description: "Amplia la busqueda a tiendas, catalogos y resultados web por texto libre.",
        url: buildGoogleUrl(`${preferredQuery} repuesto chile`),
      }
    : null);

  return {
    sourceNotice:
      "Estas sugerencias usan decodificacion oficial del VIN y busquedas abiertas. El taller debe confirmar compatibilidad y proveedor antes de comprar o guardar la referencia.",
    decodedVehicle,
    selectedPart: {
      name: partName || null,
      code: partCode || null,
    },
    search: {
      strategy: partCode ? "code-first" : "name-first",
      preferredQuery,
      codeQuery: codeOnlyQuery || null,
      descriptiveQuery: descriptiveQuery || null,
      site: "MLC",
    },
    purchaseLinks,
    mercadoLibre,
  };
}
