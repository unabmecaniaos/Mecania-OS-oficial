import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex w-fit touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] border border-transparent text-sm font-semibold shadow-[var(--shadow-control)] outline-none transition focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.16)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
        size === "md" && "min-h-11 px-5 py-2.5",
        size === "sm" && "min-h-9 px-3.5 text-xs",
        variant === "primary" &&
          "bg-[linear-gradient(180deg,var(--accent)_0%,var(--accent-strong)_100%)] text-white hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(36,88,198,0.24)]",
        variant === "secondary" &&
          "border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)] text-[var(--foreground)] hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-white hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[var(--muted-strong)] shadow-none hover:bg-[color:var(--surface-strong)] hover:text-[var(--foreground)]",
        variant === "danger" &&
          "border-[rgba(180,35,24,0.18)] bg-[color:var(--danger-soft)] text-[color:var(--danger)] hover:-translate-y-0.5 hover:border-[rgba(180,35,24,0.32)] hover:bg-[#ffe5e1]",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
