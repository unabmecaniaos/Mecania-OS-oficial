import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FlashMessageBanner } from "@/components/ui/flash-message-banner";
import { consumeFlashMessage } from "@/lib/flash";
import { getCurrentSession, getDefaultRouteForRole } from "@/modules/auth/auth.service";
import { logoutAction } from "@/app/(protected)/actions";
import { purgeExpiredTrash } from "@/modules/trash/trash.service";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await purgeExpiredTrash();
  const session = await getCurrentSession();
  const flash = await consumeFlashMessage();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MECHANIC") {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return (
    <AppShell
      onLogout={logoutAction}
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {flash ? <FlashMessageBanner message={flash.message} tone={flash.tone} /> : null}
      {children}
    </AppShell>
  );
}
