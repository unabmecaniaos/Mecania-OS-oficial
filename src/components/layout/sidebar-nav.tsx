"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Panel", short: "PL" },
  { href: "/clients", label: "Clientes", short: "CL" },
  { href: "/vehicles", label: "Vehiculos", short: "VH" },
  { href: "/self-inspections", label: "Autoinspecciones", short: "AI" },
  { href: "/work-orders", label: "Ordenes", short: "OT" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);

        return (
          <Link
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
              active
                ? "border-[rgba(55,168,255,0.26)] bg-[linear-gradient(180deg,rgba(45,74,110,0.9)_0%,rgba(29,54,83,0.98)_100%)] !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "border-transparent !text-[color:var(--muted-strong)] hover:border-[color:var(--border)] hover:bg-[rgba(34,50,74,0.72)] hover:!text-white",
            )}
            href={link.href}
            key={link.href}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border text-[11px] font-semibold tracking-[0.16em]",
                active
                  ? "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#35a7ff_0%,#1a84ff_100%)] text-white"
                  : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)]",
              )}
            >
              {link.short}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
