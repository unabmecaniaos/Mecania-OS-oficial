import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FlashMessageBanner } from "@/components/ui/flash-message-banner";
import { consumeFlashMessage } from "@/lib/flash";
import { getCurrentSession, getDefaultRouteForRole } from "@/modules/auth/auth.service";
import { logoutAction } from "@/app/(protected)/actions";

export const dynamic = "force-dynamic";

export default async function LiquidatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();
  const flash = await consumeFlashMessage();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "LIQUIDATOR") {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-white/[0.88] px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#0e223f_0%,#14325a_100%)] text-sm font-semibold uppercase tracking-[0.16em] text-white">
              MO
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#5f7fa8]">Portal liquidador</p>
              <h1 className="mt-1 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
                MecaniaOS
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-full border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-3 py-2 font-semibold text-[#1d4ed8] transition-colors hover:bg-[rgba(37,99,235,0.14)]"
                href="/liquidador"
              >
                Mis casos
              </Link>
              <Link
                className="rounded-full border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-3 py-2 font-semibold text-[#1d4ed8] transition-colors hover:bg-[rgba(37,99,235,0.14)]"
                href="/liquidador/new"
              >
                Nuevo siniestro
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {session.user.name}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{session.user.email}</p>
              </div>
              <form action={logoutAction}>
                <Button type="submit" variant="secondary">
                  Cerrar sesion
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="space-y-4 pb-8">
          {flash ? <FlashMessageBanner message={flash.message} tone={flash.tone} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
