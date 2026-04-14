import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { getCurrentSession } from "@/modules/auth/auth.service";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(session.user.role === UserRole.CUSTOMER ? "/portal" : "/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.10),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(95,127,168,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(95,127,168,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[rgba(158,193,255,0.24)] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[480px] rounded-[34px] border border-[rgba(23,52,94,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,254,0.94))] p-6 shadow-[0_30px_90px_rgba(23,52,94,0.14)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,#17345e_0%,#2563eb_58%,#9ec1ff_100%)]" />

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#0e223f_0%,#14325a_100%)] text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(20,50,90,0.22)]">
              MO
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">MecaniaOS</p>
              <p className="text-xs uppercase tracking-[0.22em] text-[#5f7fa8]">
                Acceso seguro
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h1 className="font-heading text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">
              Iniciar sesion
            </h1>
          </div>

          <div className="mt-6 rounded-[24px] border border-[rgba(37,99,235,0.12)] bg-[linear-gradient(180deg,rgba(236,244,255,0.88),rgba(247,250,254,0.92))] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#5f7fa8]">
              Acceso corporativo
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Ingresa con tu cuenta autorizada para acceder a la operacion interna, el
              seguimiento de ordenes y los portales asociados.
            </p>
          </div>

          <div className="mt-8 border-t border-[rgba(95,127,168,0.16)] pt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
