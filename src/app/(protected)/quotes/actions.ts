"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { UserRole } from "@prisma/client";

import { getErrorMessage } from "@/lib/errors";
import type { ActionState } from "@/lib/form-state";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  approveQuote,
  createQuote,
  rejectQuote,
  sendQuote,
} from "@/modules/quotes/quote.service";

function extractQuoteItems(formData: FormData) {
  const itemTypes = formData.getAll("itemType").map((value) => String(value ?? ""));
  const descriptions = formData.getAll("itemDescription").map((value) => String(value ?? ""));
  const quantities = formData.getAll("itemQuantity").map((value) => String(value ?? ""));
  const unitPrices = formData.getAll("itemUnitPrice").map((value) => String(value ?? ""));

  return itemTypes
    .map((type, index) => ({
      type,
      description: descriptions[index] ?? "",
      quantity: quantities[index] ?? "",
      unitPrice: unitPrices[index] ?? "",
    }))
    .filter(
      (item) =>
        item.description.trim() !== "" ||
        item.quantity.trim() !== "" ||
        item.unitPrice.trim() !== "",
    );
}

export async function createQuoteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);
    const quote = await createQuote(
      {
        clientId: String(formData.get("clientId") ?? ""),
        vehicleId: String(formData.get("vehicleId") ?? ""),
        selfInspectionId: String(formData.get("selfInspectionId") ?? ""),
        recipientType: String(formData.get("recipientType") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        internalNotes: String(formData.get("internalNotes") ?? ""),
        items: extractQuoteItems(formData),
      },
      session.user.id,
    );

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quote.id}`);
    redirect(`/quotes/${quote.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }
}

export async function sendQuoteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const quoteId = String(formData.get("quoteId") ?? "");

  try {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await sendQuote(
      quoteId,
      {
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    redirect(`/quotes/${quoteId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }
}

export async function approveQuoteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const quoteId = String(formData.get("quoteId") ?? "");

  try {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await approveQuote(
      quoteId,
      {
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    redirect(`/quotes/${quoteId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }
}

export async function rejectQuoteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const quoteId = String(formData.get("quoteId") ?? "");

  try {
    const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC]);

    await rejectQuote(
      quoteId,
      {
        note: String(formData.get("note") ?? ""),
      },
      session.user.id,
    );

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    redirect(`/quotes/${quoteId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: getErrorMessage(error),
    };
  }
}
