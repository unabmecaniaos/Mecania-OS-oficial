import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "border-[rgba(55,168,255,0.36)] bg-[linear-gradient(180deg,#37a8ff_0%,#238dff_100%)] text-white shadow-[0_12px_28px_rgba(15,123,255,0.24)] hover:brightness-105",
        variant === "secondary" &&
          "border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)] text-[color:var(--foreground)] hover:border-[rgba(55,168,255,0.36)] hover:bg-[color:var(--surface-muted)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
