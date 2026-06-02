import { AppError } from "@/lib/errors";
import { normalizeVin, vinSchema } from "@/lib/vin";

type NhtsaDecodeResult = {
  VIN?: string;
  Make?: string;
  Model?: string;
  ModelYear?: string;
  VehicleType?: string;
  BodyClass?: string;
  ErrorCode?: string;
  ErrorText?: string;
};

type NhtsaResponse = {
  Results?: NhtsaDecodeResult[];
};

export async function decodeVehicleVin(input: string) {
  const vin = vinSchema.parse(input);
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(
    vin,
  )}?format=json`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MecaniaOS-vin-decoder/1.0",
    },
  });

  if (!response.ok) {
    throw new AppError("No se pudo consultar NHTSA para decodificar el VIN", 502);
  }

  const payload = (await response.json()) as NhtsaResponse;
  const decoded = payload.Results?.[0];

  if (!decoded) {
    throw new AppError("NHTSA no entrego datos para este VIN", 404);
  }

  return {
    vin: normalizeVin(decoded.VIN ?? vin),
    make: decoded.Make?.trim() || null,
    model: decoded.Model?.trim() || null,
    year: decoded.ModelYear?.trim() || null,
    vehicleType: decoded.VehicleType?.trim() || null,
    bodyClass: decoded.BodyClass?.trim() || null,
    errorCode: decoded.ErrorCode?.trim() || null,
    errorText: decoded.ErrorText?.trim() || null,
  };
}
