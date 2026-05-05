"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AccessScreenProps = {
  token: string;
  statusLabel: string;
  sessionEmail: string | null;
  sessionRole: string | null;
};

class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestError";
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();

  if (!response.ok) {
    throw new RequestError(body.error ?? "No fue posible completar la solicitud");
  }

  return body.data as T;
}

export function SelfInspectionAccessScreen({
  token,
  statusLabel,
  sessionEmail,
  sessionRole,
}: AccessScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const hasDifferentSession =
    Boolean(sessionEmail) && normalizedEmail.length > 0 && sessionEmail?.toLowerCase() !== normalizedEmail;
  const canSubmitLogin = normalizedEmail.includes("@") && password.trim().length >= 8;
  const canSubmitRegister =
    fullName.trim().length >= 3 &&
    normalizedEmail.includes("@") &&
    password.trim().length >= 8 &&
    confirmPassword.trim().length >= 8;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      await requestJson(`/api/self-inspections/public/${token}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "login"
            ? {
                mode,
                email: normalizedEmail,
                password,
              }
            : {
                mode,
                fullName,
                email: normalizedEmail,
                password,
                confirmPassword,
              },
        ),
      });

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible iniciar sesion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[32px] border-[rgba(14,79,82,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(242,247,246,0.96))]">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Acceso rapido
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold">
              Entra para comenzar la autoinspeccion
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Estado actual
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                {statusLabel}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Link seguro
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                Listo para identificarte
              </p>
            </div>
          </div>

        </div>

        <div className="rounded-[28px] border border-[rgba(200,92,42,0.12)] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-[color:var(--surface)] p-1">
            {[
              { value: "login", label: "Iniciar sesion" },
              { value: "register", label: "Crear cuenta" },
            ].map((option) => (
              <button
                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                  mode === option.value
                    ? "bg-white text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    : "text-[color:var(--muted)]"
                }`}
                key={option.value}
                onClick={() => {
                  setMode(option.value as "login" | "register");
                  setError(null);
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {mode === "register" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="access-full-name">
                  Nombre completo
                </label>
                <Input
                  id="access-full-name"
                  onChange={(event) => setFullName(event.target.value)}
                  value={fullName}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="access-email">
                Correo
              </label>
              <Input
                id="access-email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="access-password">
                Contrasena
              </label>
              <Input
                id="access-password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>

            {mode === "register" ? (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-[color:var(--muted-strong)]"
                  htmlFor="access-confirm-password"
                >
                  Confirmar contrasena
                </label>
                <Input
                  id="access-confirm-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  value={confirmPassword}
                />
              </div>
            ) : null}

            {hasDifferentSession ? (
              <div className="rounded-[20px] border border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
                Hay una sesion abierta como <strong>{sessionEmail}</strong>
                {sessionRole ? ` (${sessionRole.toLowerCase()})` : ""}. Al continuar, el acceso se
                cambiara a la cuenta del cliente.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[20px] border border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
                {error}
              </div>
            ) : null}

            <Button
              className="w-full"
              disabled={
                isSubmitting || (mode === "login" ? !canSubmitLogin : !canSubmitRegister)
              }
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting
                ? mode === "login"
                  ? "Ingresando..."
                  : "Creando cuenta..."
                : mode === "login"
                  ? "Entrar y continuar"
                  : "Crear cuenta y continuar"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
