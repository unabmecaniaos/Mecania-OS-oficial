"use client";

import { cn } from "@/lib/utils";

type ChoiceSegmentFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  columns?: 2 | 3;
  disabled?: boolean;
};

export function ChoiceSegmentField({
  value,
  onChange,
  options,
  columns = 2,
  disabled,
}: ChoiceSegmentFieldProps) {
  return (
    <div className={cn("grid gap-3", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {options.map((option) => (
        <button
          className={cn(
            "min-h-11 rounded-[var(--radius-control)] border px-4 text-left text-sm font-semibold shadow-[var(--shadow-control)] outline-none transition focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.14)] disabled:cursor-not-allowed disabled:opacity-55",
            value === option.value
              ? "border-[color:var(--accent)] bg-[color:var(--info-soft)] text-[color:var(--accent-strong)]"
              : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--muted-strong)] hover:border-[color:var(--border-strong)] hover:bg-white",
          )}
          disabled={disabled}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
