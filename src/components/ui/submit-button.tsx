"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "Guardando...",
  variant = "primary",
  className,
  disabled = false,
  name,
  value,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={disabled || pending}
      name={name}
      type="submit"
      value={value}
      variant={variant}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
