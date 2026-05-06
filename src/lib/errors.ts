import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto de datos") {
    super(message, 409);
  }
}

export function isDatabaseError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  );
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(error.issues[0]?.message ?? "Datos invalidos", 422);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new ConflictError("Ya existe un registro con ese valor unico");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return new NotFoundError("Registro no encontrado");
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500);
  }

  return new AppError("Ocurrio un error inesperado", 500);
}

export function getErrorMessage(error: unknown) {
  return normalizeError(error).message;
}
