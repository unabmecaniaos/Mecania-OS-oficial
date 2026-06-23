import { BudgetItemType } from "@prisma/client";

export type BudgetFormReferenceOption = {
  id: string;
  itemType: BudgetItemType;
  name: string;
  referenceCode: string | null;
  unitPrice: number;
};

export type BudgetFormInventoryPartOption = {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
};

export function parseBudgetCatalogSelections(formData: FormData) {
  const partGrouped = new Map<
    string,
    {
      itemId?: string;
      quantity?: number;
    }
  >();
  const referenceGrouped = new Map<
    string,
    {
      itemType?: BudgetItemType;
      itemId?: string;
      quantity?: number;
    }
  >();

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue).trim();

    if (key.startsWith("partItem:")) {
      const slot = key.replace("partItem:", "");
      partGrouped.set(slot, {
        ...partGrouped.get(slot),
        itemId: value,
      });
      continue;
    }

    if (key.startsWith("partQuantity:")) {
      const slot = key.replace("partQuantity:", "");
      partGrouped.set(slot, {
        ...partGrouped.get(slot),
        quantity: Number(value),
      });
      continue;
    }

    if (key.startsWith("referenceItem:")) {
      const [, rawType, slot] = key.split(":");
      if (!Object.values(BudgetItemType).includes(rawType as BudgetItemType)) {
        continue;
      }

      referenceGrouped.set(`${rawType}:${slot}`, {
        ...referenceGrouped.get(`${rawType}:${slot}`),
        itemType: rawType as BudgetItemType,
        itemId: value,
      });
      continue;
    }

    if (key.startsWith("referenceQuantity:")) {
      const [, rawType, slot] = key.split(":");
      if (!Object.values(BudgetItemType).includes(rawType as BudgetItemType)) {
        continue;
      }

      referenceGrouped.set(`${rawType}:${slot}`, {
        ...referenceGrouped.get(`${rawType}:${slot}`),
        itemType: rawType as BudgetItemType,
        quantity: Number(value),
      });
    }
  }

  return [
    ...Array.from(partGrouped.values()).flatMap((entry) => {
      const itemId = entry.itemId?.trim() ?? "";
      const quantity = entry.quantity ?? 0;

      if (!itemId || !Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      return [
        {
          source: "inventoryPart" as const,
          itemType: BudgetItemType.PART,
          itemId,
          quantity,
        },
      ];
    }),
    ...Array.from(referenceGrouped.values()).flatMap((entry) => {
      const itemId = entry.itemId?.trim() ?? "";
      const quantity = entry.quantity ?? 0;

      if (!entry.itemType || !itemId || !Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      return [
        {
          source: "referenceCatalog" as const,
          itemType: entry.itemType,
          itemId,
          quantity,
        },
      ];
    }),
  ];
}

export function parseBudgetManualSelections(formData: FormData) {
  type DraftManualSelectionInput = {
    itemType: BudgetItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    note: string | undefined;
  };

  const grouped = new Map<
    string,
    {
      itemType?: BudgetItemType;
      description?: string;
      quantity?: number;
      unitPrice?: number;
      note?: string;
    }
  >();

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue);

    if (key.startsWith("manualDescription:")) {
      const [, rawType, slot] = key.split(":");
      if (!Object.values(BudgetItemType).includes(rawType as BudgetItemType)) {
        continue;
      }
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        itemType: rawType as BudgetItemType,
        description: value,
      });
    }

    if (key.startsWith("manualQuantity:")) {
      const [, rawType, slot] = key.split(":");
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        quantity: Number(value),
      });
    }

    if (key.startsWith("manualPrice:")) {
      const [, rawType, slot] = key.split(":");
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        unitPrice: Number(value),
      });
    }

    if (key.startsWith("manualNote:")) {
      const [, rawType, slot] = key.split(":");
      grouped.set(`${rawType}:${slot}`, {
        ...grouped.get(`${rawType}:${slot}`),
        note: value,
      });
    }
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      itemType: entry.itemType,
      description: entry.description?.trim() ?? "",
      quantity: entry.quantity ?? 0,
      unitPrice: entry.unitPrice ?? 0,
      note: entry.note?.trim() || undefined,
    }))
    .filter(
      (entry): entry is DraftManualSelectionInput =>
        Boolean(entry.itemType) &&
        entry.description.length > 0 &&
        Number.isFinite(entry.quantity) &&
        entry.quantity > 0 &&
        Number.isFinite(entry.unitPrice) &&
        entry.unitPrice >= 0,
    );
}

export function parseBudgetLineUpdates(formData: FormData) {
  const grouped = new Map<
    string,
    {
      quantity?: number;
      unitPrice?: number;
      note?: string;
    }
  >();

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue);

    if (key.startsWith("lineQty:")) {
      const id = key.replace("lineQty:", "");
      grouped.set(id, {
        ...grouped.get(id),
        quantity: Number(value),
      });
    }

    if (key.startsWith("linePrice:")) {
      const id = key.replace("linePrice:", "");
      grouped.set(id, {
        ...grouped.get(id),
        unitPrice: Number(value),
      });
    }

    if (key.startsWith("lineNote:")) {
      const id = key.replace("lineNote:", "");
      grouped.set(id, {
        ...grouped.get(id),
        note: value,
      });
    }
  }

  return Array.from(grouped.entries()).map(([id, entry]) => ({
    id,
    quantity: entry.quantity ?? 1,
    unitPrice: entry.unitPrice ?? 0,
    note: entry.note,
  }));
}
