import { cn } from "@/lib/utils";

type FormMessageProps = {
  message?: string;
  className?: string;
};

export function FormMessage({ message, className }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-2xl border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[#ffb4b4]",
        className,
      )}
    >
      {message}
    </p>
  );
}
