"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";

import { cn } from "@/lib/utils";

const baseLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kanban", label: "Kanban" },
  { href: "/reports", label: "Reportes" },
  { href: "/self-inspections", label: "Autoinspecciones" },
  { href: "/budgets", label: "Presupuestos" },
  { href: "/work-orders", label: "Ordenes" },
  { href: "/inventory", label: "Inventario" },
];

export function getSidebarLinks(role: UserRole) {
  if (role === UserRole.ADMIN) {
    return [...baseLinks, { href: "/users", label: "Usuarios" }];
  }

  return baseLinks;
}

export function SidebarNav({
  role,
  orientation = "vertical",
}: {
  role: UserRole;
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const links = getSidebarLinks(role);
  const isHorizontal = orientation === "horizontal";

  return (
    <nav className={cn(isHorizontal ? "flex gap-2" : "space-y-2")}>
      {links.map((link) => {
        const active = pathname.startsWith(link.href);

        return (
          <Link
            className={cn(
              "flex items-center rounded-[var(--radius-control)] border text-sm font-semibold outline-none transition hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.14)]",
              isHorizontal ? "whitespace-nowrap px-4 py-2.5" : "w-full px-4 py-3",
              active
                ? isHorizontal
                  ? "border-[rgba(36,88,198,0.22)] bg-[color:var(--info-soft)] !text-[color:var(--accent-strong)] shadow-[var(--shadow-control)]"
                  : "border-[#4d6d99] bg-[#27466f] !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : isHorizontal
                  ? "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:border-[rgba(36,88,198,0.12)] hover:bg-[color:var(--info-soft)] hover:text-[color:var(--accent-strong)]"
                  : "border-transparent !text-[#d7e5fb] hover:border-[#35567f] hover:bg-[#183557] hover:!text-white",
            )}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
