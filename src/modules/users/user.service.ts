import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { clientRepository } from "@/modules/clients/client.repository";
import { userRepository } from "@/modules/users/user.repository";
import {
  createManagedUserSchema,
  listUsersFiltersSchema,
  updateManagedUserSchema,
} from "@/modules/users/user.schemas";

async function assertCustomerClientAvailability(clientId: string, currentUserId?: string) {
  const linkedUser = await userRepository.findByClientId(clientId);

  if (linkedUser && linkedUser.id !== currentUserId) {
    throw new ConflictError("Ese cliente ya tiene una cuenta de acceso asociada");
  }
}

function resolveManagedClientId(role: UserRole, clientId?: string) {
  if (role !== UserRole.CUSTOMER) {
    return null;
  }

  if (!clientId) {
    throw new ConflictError("Debes seleccionar un cliente para una cuenta de cliente");
  }

  return clientId;
}

export async function listUsers(input?: unknown) {
  const filters = listUsersFiltersSchema.parse(input ?? {});

  return userRepository.listUsers({
    search: filters.q?.trim(),
    role: filters.role,
  });
}

export async function listAssignableClients() {
  return clientRepository.listForUserAssignment();
}

export async function listMechanics() {
  return userRepository.listMechanics();
}

export async function createManagedUser(input: unknown) {
  const data = createManagedUserSchema.parse(input);
  const email = data.email.toLowerCase();
  const existing = await userRepository.findByEmail(email);
  const clientId = resolveManagedClientId(data.role, data.clientId);

  if (existing) {
    throw new ConflictError("Ya existe un usuario con ese correo");
  }

  if (clientId) {
    await assertCustomerClientAvailability(clientId);
  }

  const createdUser = await userRepository.create({
    name: data.name,
    email,
    passwordHash: await hash(data.password, 10),
    role: data.role,
    ...(clientId ? { clientId } : {}),
  });

  if (clientId) {
    await clientRepository.update(clientId, {
      fullName: data.name,
      email,
    });
  }

  return createdUser;
}

export async function updateManagedUser(id: string, input: unknown, actorId?: string) {
  const data = updateManagedUserSchema.parse(input);
  const existing = await userRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Usuario no encontrado");
  }

  if (actorId && existing.id === actorId) {
    if (data.role !== existing.role) {
      throw new ConflictError("No puedes cambiar tu propio rol desde esta pantalla");
    }

    if (data.active !== existing.active) {
      throw new ConflictError("No puedes desactivar tu propia cuenta desde esta pantalla");
    }
  }

  const email = data.email.toLowerCase();
  const clientId = resolveManagedClientId(data.role, data.clientId);
  const emailOwner = await userRepository.findByEmail(email);

  if (emailOwner && emailOwner.id !== id) {
    throw new ConflictError("Ya existe un usuario con ese correo");
  }

  if (clientId) {
    await assertCustomerClientAvailability(clientId, id);
  }

  const passwordHash = data.password ? await hash(data.password, 10) : undefined;

  const updatedUser = await userRepository.update(id, {
    name: data.name,
    email,
    role: data.role,
    active: data.active,
    passwordHash,
    clientId,
  });

  if (clientId) {
    await clientRepository.update(clientId, {
      fullName: data.name,
      email,
    });
  }

  return updatedUser;
}

export async function deleteManagedUser(id: string, actorId: string) {
  const existing = await userRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Usuario no encontrado");
  }

  if (existing.id === actorId) {
    throw new ConflictError("No puedes eliminar tu propio usuario");
  }

  const impact = await userRepository.getDeletionImpact(id);
  const blockedRelations = Object.values(impact).reduce((sum, count) => sum + count, 0);

  if (blockedRelations > 0) {
    throw new ConflictError(
      "No se puede eliminar este usuario porque ya tiene trazabilidad operativa. Desactivalo en su lugar.",
    );
  }

  await userRepository.delete(id);
}

export function getUserRoleLabel(role: UserRole) {
  if (role === UserRole.ADMIN) {
    return "Administrador";
  }

  if (role === UserRole.MECHANIC) {
    return "Mecanico";
  }

  return "Cliente";
}

export function getInternalRoleLabel(role: UserRole) {
  return getUserRoleLabel(role);
}
