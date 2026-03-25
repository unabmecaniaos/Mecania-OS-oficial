import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session && session.user.role !== UserRole.CUSTOMER) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] items-center px-4 py-8 md:px-8 lg:px-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="hidden min-h-[620px] overflow-hidden border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(12,23,38,0.96)_0%,rgba(16,27,45,1)_100%)] p-8 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(55,168,255,0.32)] bg-[linear-gradient(180deg,#37a8ff_0%,#238dff_100%)] text-sm font-bold tracking-[0.2em] text-white">
              MO
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--accent)]">
                MecaniaOS
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                Plataforma operativa de taller
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-lg">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Acceso interno
            </p>
            <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight text-white">
              Controla la operacion sin salir del taller.
            </h1>
            <p className="mt-5 text-base leading-7 text-[color:var(--muted-strong)]">
              Clientes, vehiculos, ordenes y trazabilidad tecnica en una interfaz oscura, compacta
              y orientada al trabajo diario.
            </p>
          </div>

          <div className="mt-auto grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Flujo
              </p>
              <p className="mt-3 text-lg font-semibold text-white">Recepcion a entrega</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                Todo el estado del taller visible desde un mismo panel.
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Enfoque
              </p>
              <p className="mt-3 text-lg font-semibold text-white">Operacion compacta</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                Menos ruido visual, mas contexto util y acciones claras.
              </p>
            </div>
          </div>
        </Card>

        <Card className="w-full max-w-[560px] justify-self-center border-[color:var(--border-strong)] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
            Acceso al sistema
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white">Iniciar sesion</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
            Usa una cuenta interna para entrar al panel operativo del taller.
          </p>

          <div className="mt-8 rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.58)] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Credenciales de prueba
            </p>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--muted-strong)]">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="font-semibold text-white">Administrador</p>
                <p className="mt-1">admin@mecaniaos.local</p>
                <p className="mt-1 font-medium text-[color:var(--accent)]">Admin1234!</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="font-semibold text-white">Mecanico</p>
                <p className="mt-1">mecanico@mecaniaos.local</p>
                <p className="mt-1 font-medium text-[color:var(--accent)]">Mechanic1234!</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
