"use client";

import { FormEvent, useState } from "react";

type FormErrors = Partial<Record<"name" | "email" | "workshop", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DemoLeadForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedName, setSubmittedName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const workshop = String(data.get("workshop") ?? "").trim();
    const website = String(data.get("website") ?? "").trim();
    const nextErrors: FormErrors = {};

    if (name.length < 2) {
      nextErrors.name = "Ingresa tu nombre.";
    }

    if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    if (workshop.length < 2) {
      nextErrors.workshop = "Ingresa el nombre de tu taller o empresa.";
    }

    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, workshop, website }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setSubmittedName(name.split(" ")[0]);
      form.reset();
    } catch {
      setSubmitError(
        "No pudimos registrar tu solicitud. Revisa tu conexión e intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearError(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  if (submittedName) {
    return (
      <div
        aria-live="polite"
        className="rounded-[28px] border border-[#4f78a6] bg-white p-7 text-[#102842] shadow-[0_28px_70px_rgba(0,0,0,0.2)] sm:p-10"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e2f7ec] text-[#1b8751]">
          <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
            <path
              d="m5 12 4 4L19 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
          </svg>
        </span>
        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.14em] text-[#3971b2]">
          Solicitud registrada
        </p>
        <h3 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">
          Gracias, {submittedName}.
        </h3>
        <p className="mt-4 text-sm leading-7 text-[#63768c]">
          Recibimos tus datos correctamente. El equipo comercial se pondrá en
          contacto para coordinar una demostración enfocada en tu operación.
        </p>
        <button
          className="mt-7 rounded-xl border border-[#cbd9e8] px-5 py-3 text-sm font-bold text-[#285583] transition hover:border-[#8fb6e6] hover:bg-[#f5f9fe]"
          onClick={() => setSubmittedName("")}
          type="button"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-[28px] border border-[#4f78a6] bg-white p-6 text-[#102842] shadow-[0_28px_70px_rgba(0,0,0,0.2)] sm:p-9"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#3971b2]">
          Solicita tu demostración
        </p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">
          Hablemos de tu operación.
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#6b7d91]">
          Completa tus datos y prepara tus preguntas. La conversación parte
          desde tu realidad, no desde una presentación genérica.
        </p>
      </div>

      <div className="mt-7 grid gap-5">
        <div aria-hidden="true" className="absolute -left-[9999px] opacity-0">
          <label htmlFor="website">Sitio web</label>
          <input
            autoComplete="off"
            id="website"
            name="website"
            tabIndex={-1}
            type="text"
          />
        </div>
        <FormField
          autoComplete="name"
          error={errors.name}
          label="Nombre"
          name="name"
          onChange={() => clearError("name")}
          placeholder="Tu nombre"
        />
        <FormField
          autoComplete="email"
          error={errors.email}
          label="Correo"
          name="email"
          onChange={() => clearError("email")}
          placeholder="nombre@empresa.cl"
          type="email"
        />
        <FormField
          autoComplete="organization"
          error={errors.workshop}
          label="Nombre del taller"
          name="workshop"
          onChange={() => clearError("workshop")}
          placeholder="Taller o liquidadora"
        />
      </div>

      <button
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0d63e5] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(13,99,229,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b55c5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#99c2f5] disabled:cursor-wait disabled:opacity-65"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Registrando solicitud..." : "Quiero conocer MecaniaOS"}
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
          <path
            d="M5 12h14m-5-5 5 5-5 5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {submitError ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl border border-[#efc3c3] bg-[#fff4f4] px-4 py-3 text-center text-xs font-semibold leading-5 text-[#a93636]"
        >
          {submitError}
        </p>
      ) : null}

      <p className="mt-4 text-center text-[11px] leading-5 text-[#8291a3]">
        Al enviar aceptas ser contactado por el equipo de MecaniaOS.
      </p>
    </form>
  );
}

function FormField({
  label,
  name,
  placeholder,
  error,
  type = "text",
  autoComplete,
  onChange,
}: {
  label: string;
  name: "name" | "email" | "workshop";
  placeholder: string;
  error?: string;
  type?: "text" | "email";
  autoComplete: string;
  onChange: () => void;
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label className="text-sm font-bold text-[#263f5b]" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={`mt-2 min-h-12 w-full rounded-xl border bg-[#f8fafc] px-4 py-3 text-sm text-[#17324f] outline-none transition placeholder:text-[#9aa8b8] focus:bg-white focus:ring-4 ${
          error
            ? "border-[#d45353] focus:border-[#d45353] focus:ring-[#d45353]/10"
            : "border-[#d5e0eb] focus:border-[#4387dd] focus:ring-[#4387dd]/10"
        }`}
        id={name}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-[#bd3d3d]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
