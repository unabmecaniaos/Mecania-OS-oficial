"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";

import { cn } from "@/lib/utils";

type SidebarIconKey = "dashboard" | "inspections" | "budgets" | "orders" | "inventory" | "users";

type SidebarLink = {
  href: string;
  label: string;
  icon: SidebarIconKey;
};

const baseLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Panel", icon: "dashboard" },
  { href: "/self-inspections", label: "Autoinspecciones", icon: "inspections" },
  { href: "/budgets", label: "Presupuestos", icon: "budgets" },
  { href: "/work-orders", label: "Ordenes", icon: "orders" },
  { href: "/inventory", label: "Inventario", icon: "inventory" },
];

function SidebarIcon({ icon }: { icon: SidebarIconKey }) {
  const commonProps = {
    className: "h-[18px] w-[18px] shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (icon) {
    case "dashboard":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M4 5h7v6H4z" />
          <path d="M13 5h7v10h-7z" />
          <path d="M4 13h7v6H4z" />
          <path d="M13 17h7v2h-7z" />
        </svg>
      );
    case "inspections":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M7 5h10" />
          <path d="M7 9h10" />
          <path d="M7 13h6" />
          <path d="M7 17h4" />
          <path d="M5 5v14" />
          <path d="M19 5v14" />
        </svg>
      );
    case "budgets":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M12 3v18" />
          <path d="M16.5 7.5c0-1.9-1.8-3.5-4.5-3.5S7.5 5.6 7.5 7.5 9 10 12 10s4.5 1.6 4.5 3.5S14.7 17 12 17s-4.5-1.6-4.5-3.5" />
        </svg>
      );
    case "orders":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M7 6h10" />
          <path d="M7 12h10" />
          <path d="M7 18h10" />
          <path d="M4 6h.01" />
          <path d="M4 12h.01" />
          <path d="M4 18h.01" />
        </svg>
      );
    case "inventory":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M4 8.5 12 4l8 4.5-8 4.5z" />
          <path d="M4 8.5V16l8 4 8-4V8.5" />
          <path d="M12 13v7" />
        </svg>
      );
    case "users":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    default:
      return null;
  }
}

export function getSidebarLinks(role: UserRole) {
  return role === UserRole.ADMIN
    ? [...baseLinks, { href: "/users", label: "Usuarios", icon: "users" as const }]
    : baseLinks;
}

export function SidebarNav({
  role,
  orientation = "vertical",
  collapsed = false,
}: {
  role: UserRole;
  orientation?: "vertical" | "horizontal";
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const links = getSidebarLinks(role);
  const isHorizontal = orientation === "horizontal";

  return (
    <nav className={cn(isHorizontal ? "flex gap-2" : "space-y-2") }>
      {links.map((link) => {
        const active = pathname.startsWith(link.href);

        return (
          <Link
            aria-label={link.label}
            className={cn(
              "flex items-center rounded-xl border text-sm font-medium transition-all duration-300",
              isHorizontal
                ? "whitespace-nowrap px-4 py-2.5"
                : collapsed
                  ? "w-full justify-center px-3 py-3"
                  : "w-full gap-3 px-4 py-3",
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
            title={!isHorizontal && collapsed ? link.label : undefined}
          >
            {!isHorizontal ? <SidebarIcon icon={link.icon} /> : null}
            <span
              className={cn(
                "transition-all duration-300",
                !isHorizontal && collapsed ? "pointer-events-none w-0 overflow-hidden opacity-0" : "opacity-100",
              )}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
