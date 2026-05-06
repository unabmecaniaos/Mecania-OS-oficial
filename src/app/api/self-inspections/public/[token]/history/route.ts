import { AppError } from "@/lib/errors";
import { apiError } from "@/lib/http";

export async function PUT() {
  return apiError(new AppError("Esta version de la autoinspeccion ya no utiliza este paso", 410));
}