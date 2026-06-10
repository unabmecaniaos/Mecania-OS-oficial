"use client";

import { cn } from "@/lib/utils";

type BooleanSegmentFieldProps = {
  value?: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function BooleanSegmentField({
  value,
  onChange,
  disabled,
}: BooleanSegmentFieldProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Si", nextValue: true },
        { label: "No", nextValue: false },
      ].map((option) => (
        <button
          className={cn(
            "min-h-11 rounded-[var(--radius-control)] border px-4 text-sm font-semibold shadow-[var(--shadow-control)] outline-none transition focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.14)] disabled:cursor-not-allowed disabled:opacity-55",
            value === option.nextValue
              ? "border-[color:var(--accent)] bg-[color:var(--info-soft)] text-[color:var(--accent-strong)]"
              : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--muted-strong)] hover:border-[color:var(--border-strong)] hover:bg-white",
          )}
          disabled={disabled}
          key={option.label}
          onClick={() => onChange(option.nextValue)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
