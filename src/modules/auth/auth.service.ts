import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/modules/auth/auth.constants";
import { authRepository } from "@/modules/auth/auth.repository";
import { loginSchema } from "@/modules/auth/auth.schemas";
import type { AuthSession } from "@/modules/auth/auth.types";

const authLogger = createLogger("auth");

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

async function shouldUseSecureCookies() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return new URL(env.APP_URL).protocol === "https:";
}

export async function signIn(input: unknown) {
  const { email, password } = loginSchema.parse(input);
  const user = await authRepository.findUserByEmail(email);

  if (!user || !user.active) {
    authLogger.warn("Login rejected", {
      email,
      reason: "invalid_credentials_or_inactive_user",
    });
    throw new UnauthorizedError("Credenciales invalidas");
  }

  const passwordMatches = await compare(password, user.passwordHash);

  if (!passwordMatches) {
    authLogger.warn("Login rejected", {
      email,
      reason: "invalid_password",
      userId: user.id,
    });
    throw new UnauthorizedError("Credenciales invalidas");
  }

  const rawToken = createSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await authRepository.createSession(user.id, tokenHash, expiresAt);

  const cookieStore = await cookies();
  const secure = await shouldUseSecureCookies();

  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
  });

  authLogger.info("Login successful", {
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
  };
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await authRepository.findSessionByTokenHash(hashSessionToken(token));

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date() || !session.user.active) {
    return null;
  }

  return session;
}

export async function requireApiUser(roles?: UserRole[]) {
  const session = await getCurrentSession();

  if (!session) {
    authLogger.warn("Unauthorized access attempt", {
      requiredRoles: roles,
    });
    throw new UnauthorizedError();
  }

  if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
    authLogger.warn("Forbidden access attempt", {
      userId: session.user.id,
      role: session.user.role,
      requiredRoles: roles,
    });
    throw new ForbiddenError();
  }

  return session;
}

export async function requireCustomerUser() {
  return requireApiUser([UserRole.CUSTOMER]);
}

export async function requireLiquidatorUser() {
  return requireApiUser([UserRole.LIQUIDATOR]);
}

export function getDefaultRouteForRole(role: UserRole) {
  if (role === UserRole.CUSTOMER) {
    return "/portal";
  }

  if (role === UserRole.LIQUIDATOR) {
    return "/liquidador";
  }

  return "/dashboard";
}

export async function signOut() {
  const session = await getCurrentSession();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const secure = await shouldUseSecureCookies();

  if (token) {
    await authRepository.deleteSessionByTokenHash(hashSessionToken(token));
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
  });

  if (session) {
    authLogger.info("Logout completed", {
      userId: session.user.id,
      role: session.user.role,
      email: session.user.email,
    });
  }
}
