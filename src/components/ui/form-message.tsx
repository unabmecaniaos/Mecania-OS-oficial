import { cn } from "@/lib/utils";

type FormMessageProps = {
  message?: string;
  tone?: "error" | "success" | "info";
  className?: string;
};

export function FormMessage({
  message,
  tone = "error",
  className,
}: FormMessageProps) {
  if (!message) {
    return null;
  }

  const toneClass =
    tone === "success"
      ? "border-[rgba(20,122,75,0.2)] bg-[color:var(--success-soft)] text-[color:var(--success)]"
      : tone === "info"
        ? "border-[rgba(36,88,198,0.2)] bg-[color:var(--info-soft)] text-[color:var(--accent)]"
        : "border-[rgba(180,35,24,0.2)] bg-[color:var(--danger-soft)] text-[color:var(--danger)]";

  return (
    <div
      className={cn(
        "animate-toast-in flex items-start gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium shadow-[var(--shadow-control)]",
        toneClass,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          tone === "success"
            ? "bg-white/70 text-[color:var(--success)]"
            : tone === "info"
              ? "bg-white/70 text-[color:var(--accent)]"
              : "bg-white/70 text-[color:var(--danger)]",
        )}
      >
        {tone === "success" ? "OK" : tone === "info" ? "i" : "!"}
      </span>
      <p className="leading-6">{message}</p>
    </div>
  );
}
