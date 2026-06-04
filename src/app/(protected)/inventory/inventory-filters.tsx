"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type InventoryFiltersProps = {
  q?: string;
  lowStock?: string;
};

function buildInventoryHref(pathname: string, nextQuery: string, nextLowStock: string) {
  const params = new URLSearchParams();

  if (nextQuery.trim()) {
    params.set("q", nextQuery.trim());
  }

  if (nextLowStock) {
    params.set("lowStock", nextLowStock);
  }

  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}

export function InventoryFilters({ q, lowStock }: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const initialQuery = q ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [stockFilter, setStockFilter] = useState(lowStock ?? "");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (query === initialQuery) {
        return;
      }

      const href = buildInventoryHref(pathname, query, stockFilter);

      startTransition(() => {
        router.replace(href);
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [initialQuery, pathname, query, router, startTransition, stockFilter]);

  return (
    <div
      aria-busy={isPending}
      className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]"
    >
      <Input
        className="min-w-0"
        name="q"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre o codigo"
        value={query}
      />
      <Select
        className="min-w-0"
        name="lowStock"
        onChange={(event) => {
          const nextLowStock = event.target.value;
          setStockFilter(nextLowStock);
          const href = buildInventoryHref(pathname, query, nextLowStock);

          startTransition(() => {
            router.replace(href);
          });
        }}
        value={stockFilter}
      >
        <option value="">Todo el inventario</option>
        <option value="1">Solo stock bajo</option>
      </Select>
    </div>
  );
}
