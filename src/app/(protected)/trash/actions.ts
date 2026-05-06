"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { requireApiUser } from "@/modules/auth/auth.service";
import { setFlashMessage } from "@/lib/flash";
import { revalidateApplicationData } from "@/lib/revalidation";
import {
  deleteBudgetForever,
  deleteClientForever,
  deleteRepuestoForever,
  deleteVehicleForever,
  deleteWorkOrderForever,
  restoreBudget,
  restoreClient,
  restoreRepuesto,
  restoreVehicle,
  restoreWorkOrder,
  restoreSelfInspection,
  trashBudget,
  trashClient,
  trashRepuesto,
  trashVehicle,
  trashWorkOrder,
  type TrashEntityType,
} from "@/modules/trash/trash.service";

const COMMON_REVALIDATE_PATHS = [
  "/dashboard",
  "/clients",
  "/clients/trash",
  "/vehicles",
  "/vehicles/trash",
  "/work-orders",
  "/work-orders/trash",
  "/budgets",
  "/budgets/trash",
  "/inventory",
  "/inventory/trash",
  "/self-inspections",
  "/portal",
] as const;

const TRASH_REDIRECTS_BY_ENTITY_TYPE: Record<TrashEntityType, string> = {
  budget: "/budgets/trash",
  client: "/clients/trash",
  repuesto: "/inventory/trash",
  selfInspection: "/self-inspections",
  vehicle: "/vehicles/trash",
  workOrder: "/work-orders/trash",
};

function revalidateTrashRelatedPaths() {
  revalidateApplicationData();

  for (const path of COMMON_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function assertEntityPermission(entityType: TrashEntityType) {
  if (entityType === "repuesto") {
    return requireApiUser([UserRole.ADMIN]);
  }

  if (entityType === "budget") {
    return requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
  }

  return requireApiUser();
}

function getEntityType(formData: FormData) {
  return String(formData.get("entityType") ?? "") as TrashEntityType;
}

function getEntityId(formData: FormData) {
  return String(formData.get("entityId") ?? "");
}

function getRedirectTarget(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export async function moveToTrashAction(
  formData: FormData,
): Promise<void> {
  const entityType = getEntityType(formData);
  const entityId = getEntityId(formData);

  await assertEntityPermission(entityType);

  switch (entityType) {
    case "client":
      await trashClient(entityId);
      break;
    case "vehicle":
      await trashVehicle(entityId);
      break;
    case "workOrder":
      await trashWorkOrder(entityId);
      break;
    case "budget":
      await trashBudget(entityId);
      break;
    case "repuesto":
      await trashRepuesto(entityId);
      break;
    default:
      throw new Error("No se pudo identificar el tipo de elemento a borrar.");
  }

  revalidateTrashRelatedPaths();
  await setFlashMessage({
    message: "Elemento movido a papelera correctamente.",
    tone: "success",
  });
  redirect(getRedirectTarget(formData, TRASH_REDIRECTS_BY_ENTITY_TYPE[entityType]));
}

export async function restoreTrashItemAction(
  formData: FormData,
): Promise<void> {
  const entityType = getEntityType(formData);
  const entityId = getEntityId(formData);

  await assertEntityPermission(entityType);

  switch (entityType) {
    case "client":
      await restoreClient(entityId);
      break;
    case "vehicle":
      await restoreVehicle(entityId);
      break;
    case "workOrder":
      await restoreWorkOrder(entityId);
      break;
    case "budget":
      await restoreBudget(entityId);
      break;
    case "repuesto":
      await restoreRepuesto(entityId);
      break;
    case "selfInspection":
      await restoreSelfInspection(entityId);
      break;
    default:
      throw new Error("No se pudo identificar el tipo de elemento a restaurar.");
  }

  revalidateTrashRelatedPaths();
  await setFlashMessage({
    message: "Elemento restaurado correctamente.",
    tone: "success",
  });
  redirect(getRedirectTarget(formData, TRASH_REDIRECTS_BY_ENTITY_TYPE[entityType]));
}

export async function deleteTrashItemForeverAction(
  formData: FormData,
): Promise<void> {
  const entityType = getEntityType(formData);
  const entityId = getEntityId(formData);

  await assertEntityPermission(entityType);

  switch (entityType) {
    case "client":
      await deleteClientForever(entityId);
      break;
    case "vehicle":
      await deleteVehicleForever(entityId);
      break;
    case "workOrder":
      await deleteWorkOrderForever(entityId);
      break;
    case "budget":
      await deleteBudgetForever(entityId);
      break;
    case "repuesto":
      await deleteRepuestoForever(entityId);
      break;
    default:
      throw new Error("Este elemento no admite borrado definitivo manual.");
  }

  revalidateTrashRelatedPaths();
  await setFlashMessage({
    message: "Elemento eliminado definitivamente.",
    tone: "success",
  });
  redirect(getRedirectTarget(formData, TRASH_REDIRECTS_BY_ENTITY_TYPE[entityType]));
}
