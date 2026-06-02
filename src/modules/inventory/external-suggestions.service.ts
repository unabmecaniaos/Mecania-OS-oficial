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
  limit?: number;
};

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
        "Mercado Libre requiere un access token oficial para consultar productos desde este entorno.",
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
  const query = buildMercadoLibreQuery({
    query: input.query,
    make: decodedVehicle.make,
    model: decodedVehicle.model,
    year: decodedVehicle.year,
  });

  if (!query) {
    throw new AppError("Ingresa un repuesto o una consulta para buscar sugerencias", 422);
  }

  const mercadoLibre = await searchMercadoLibre({
    query,
    limit: Math.min(Math.max(input.limit ?? 8, 1), 20),
  });

  return {
    sourceNotice:
      "Estas sugerencias vienen de APIs oficiales y deben ser confirmadas por el taller antes de guardarse como compatibilidad.",
    decodedVehicle,
    search: {
      query,
      site: "MLC",
    },
    mercadoLibre,
  };
}
