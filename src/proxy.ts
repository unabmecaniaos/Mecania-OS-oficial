import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/auth/auth.constants";

const protectedRoutes = [
  "/dashboard",
  "/clients",
  "/vehicles",
  "/work-orders",
  "/budgets",
  "/inventory",
  "/self-inspections",
  "/users",
  "/trash",
  "/insurance-cases",
  "/portal",
  "/liquidador",
];

const publicRoutes = [
  "/self-inspections/start",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isProtected = !isPublic && protectedRoutes.some((route) => pathname.startsWith(route));

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
    "/work-orders/:path*",
    "/budgets/:path*",
    "/inventory/:path*",
    "/self-inspections/:path*",
    "/users/:path*",
    "/trash/:path*",
    "/insurance-cases/:path*",
    "/portal/:path*",
    "/liquidador/:path*",
  ],
};
