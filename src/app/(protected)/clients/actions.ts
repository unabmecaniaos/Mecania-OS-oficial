"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { setFlashMessage } from "@/lib/flash";
import type { ActionState } from "@/lib/form-state";
import { executeServerAction } from "@/lib/server-action";
import { createClient } from "@/modules/clients/client.service";
import { requireApiUser } from "@/modules/auth/auth.service";
import { createStaffAssistedSelfInspection } from "@/modules/self-inspections/self-inspection.service";
import { createVehicle } from "@/modules/vehicles/vehicle.service";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createClientAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await executeServerAction("createClientAction", async () => {
    const session = await requireApiUser();
    const nextStep = getText(formData, "nextStep") || "list";

    const client = await createClient(
      {
        fullName: getText(formData, "fullName"),
        localIdentifier: getText(formData, "localIdentifier"),
        phone: getText(formData, "phone"),
        email: getText(formData, "email"),
        address: getText(formData, "address"),
        portalPassword: getText(formData, "portalPassword"),
      },
      session.user.id,
    );

    const vehicleFields = [
      "vehicleVin",
      "vehicleMake",
      "vehicleModel",
      "vehicleYear",
      "vehiclePlate",
      "vehicleColor",
      "vehicleMileage",
    ];
    const shouldCreateVehicle = vehicleFields.some((field) => getText(formData, field));
    const vehicle = shouldCreateVehicle
      ? await createVehicle(
          {
            clientId: client.id,
            plate: getText(formData, "vehiclePlate"),
            vin: getText(formData, "vehicleVin"),
            make: getText(formData, "vehicleMake"),
            model: getText(formData, "vehicleModel"),
            year: getText(formData, "vehicleYear"),
            color: getText(formData, "vehicleColor"),
            mileage: getText(formData, "vehicleMileage"),
          },
          session.user.id,
        )
      : null;

    const inspectionMainComplaint = getText(formData, "inspectionMainComplaint");
    const inspectionNotes = getText(formData, "inspectionNotes");

    if (vehicle && (inspectionMainComplaint || inspectionNotes)) {
      const inspection = await createStaffAssistedSelfInspection(
        {
          customerId: client.id,
          vehicleId: vehicle.id,
          mainComplaint: inspectionMainComplaint,
          notes: inspectionNotes,
        },
        session.user.id,
      );

      return {
        clientId: client.id,
        vehicleId: vehicle.id,
        inspectionId: inspection.id,
        nextStep,
      };
    }

    return {
      clientId: client.id,
      vehicleId: vehicle?.id ?? null,
      inspectionId: null,
      nextStep,
    };
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/clients");
  revalidatePath("/vehicles");
  revalidatePath("/self-inspections");
  await setFlashMessage({
    message: "Cliente creado correctamente.",
    tone: "success",
  });

  if (result.data.nextStep === "vehicle") {
    redirect(`/vehicles/new?clientId=${encodeURIComponent(result.data.clientId)}`);
  }

  if (result.data.nextStep === "inspection" && result.data.inspectionId) {
    redirect(`/self-inspections/${result.data.inspectionId}`);
  }

  redirect("/clients");
}
