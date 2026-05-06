import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { userRepository } from "@/modules/users/user.repository";
import {
  createInternalUserSchema,
  updateInternalUserSchema,
} from "@/modules/users/user.schemas";

const userLogger = createLogger("users");

export async function listInternalUsers() {
  return userRepository.listInternalUsers();
}

export async function listMechanics() {
  return userRepository.listMechanics();
}

export async function listLiquidators() {
  return userRepository.listLiquidators();
}

export async function createInternalUser(input: unknown, actorId?: string) {
  const data = createInternalUserSchema.parse(input);
  const email = data.email.toLowerCase();
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    throw new ConflictError("Ya existe un usuario con ese correo");
  }

  const user = await userRepository.create({
    name: data.name,
    email,
    passwordHash: await hash(data.password, 10),
    role: data.role,
  });

  userLogger.info("Internal user created", {
    actorId,
    userId: user.id,
    role: user.role,
  });

  return user;
}

export async function updateInternalUser(id: string, input: unknown, actorId?: string) {
  const data = updateInternalUserSchema.parse(input);
  const existing = await userRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Usuario no encontrado");
  }

  const passwordHash = data.password ? await hash(data.password, 10) : undefined;

  const user = await userRepository.update(id, {
    role: data.role,
    active: data.active,
    passwordHash,
  });

  userLogger.info("Internal user updated", {
    actorId,
    userId: user.id,
    role: user.role,
    active: user.active,
  });

  return user;
}

export function getInternalRoleLabel(role: UserRole) {
  if (role === UserRole.ADMIN) {
    return "Administrador";
  }

  if (role === UserRole.MECHANIC) {
    return "Mecanico";
  }

  if (role === UserRole.LIQUIDATOR) {
    return "Liquidador";
  }

  return "Cliente";
}
