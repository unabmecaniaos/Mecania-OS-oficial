"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";
import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="email">
          Correo
        </label>
        <Input
          autoComplete="email"
          className="min-h-12 rounded-2xl border-[rgba(95,127,168,0.18)] bg-[rgba(248,251,255,0.92)] px-4 shadow-none focus:border-[#2563eb] focus:ring-[rgba(37,99,235,0.14)]"
          id="email"
          name="email"
          placeholder="correo@empresa.com"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="password">
          Contrasena
        </label>
        <Input
          autoComplete="current-password"
          className="min-h-12 rounded-2xl border-[rgba(95,127,168,0.18)] bg-[rgba(248,251,255,0.92)] px-4 shadow-none focus:border-[#2563eb] focus:ring-[rgba(37,99,235,0.14)]"
          id="password"
          name="password"
          placeholder="Ingresa tu contrasena"
          type="password"
        />
      </div>

      <FormMessage className="rounded-2xl" message={state.error} />

      <SubmitButton
        className="min-h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#17345e_0%,#14325a_100%)] shadow-[0_18px_36px_rgba(23,52,94,0.22)] hover:shadow-[0_22px_42px_rgba(23,52,94,0.26)]"
        label="Entrar"
        pendingLabel="Ingresando..."
      />
    </form>
  );
}
