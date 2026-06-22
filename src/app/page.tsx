import { redirect } from "next/navigation";

import { getCurrentSession, getDefaultRouteForRole } from "@/modules/auth/auth.service";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  redirect(getDefaultRouteForRole(session.user.role));
}
