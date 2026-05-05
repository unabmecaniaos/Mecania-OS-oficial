"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";

import { cn } from "@/lib/utils";

const baseLinks = [
  { href: "/dashboard", label: "Panel" },
  { href: "/self-inspections", label: "Autoinspecciones" },
  { href: "/budgets", label: "Presupuestos" },
  { href: "/work-orders", label: "Ordenes" },
  { href: "/inventory", label: "Inventario" },
];

export function getSidebarLinks(role: UserRole) {
  return role === UserRole.ADMIN
    ? [...baseLinks, { href: "/users", label: "Usuarios" }]
    : baseLinks;
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
              "flex items-center rounded-xl border text-sm font-medium transition-colors",
              isHorizontal ? "whitespace-nowrap px-4 py-2.5" : "w-full px-4 py-3",
              active
                ? isHorizontal
                  ? "border-[rgba(37,99,235,0.22)] bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(37,99,235,0.10))] !text-[#1d4ed8] shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
                  : "border-[#4d6d99] bg-[#27466f] !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : isHorizontal
                  ? "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.12)] hover:bg-[rgba(37,99,235,0.08)] hover:text-[#1d4ed8]"
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
