import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/auth/auth.constants";

const protectedRoutes = [
  "/dashboard",
  "/clients",
  "/vehicles",
  "/self-inspections",
  "/quotes",
  "/work-orders",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!hasSession && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/vehicles/:path*",
    "/self-inspections/:path*",
    "/quotes/:path*",
    "/work-orders/:path*",
  ],
};
