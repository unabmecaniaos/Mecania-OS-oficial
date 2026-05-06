import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { userRepository } from "@/modules/users/user.repository";
import { clientRepository } from "@/modules/clients/client.repository";
import {
  createClientSchema,
  updateClientSchema,
} from "@/modules/clients/client.schemas";

const clientLogger = createLogger("clients");

export async function listClients(search?: string) {
  return clientRepository.list(search?.trim());
}

export async function getClientById(id: string) {
  const client = await clientRepository.findById(id);

  if (!client) {
    throw new NotFoundError("Cliente no encontrado");
  }

  return client;
}

export async function createClient(input: unknown, actorId?: string) {
  const data = createClientSchema.parse(input);
  const email = data.email.toLowerCase();

  if (data.portalPassword) {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictError("Ya existe un usuario con ese correo");
    }
  }

  const client = await clientRepository.create({
    fullName: data.fullName,
    localIdentifier: data.localIdentifier,
    phone: data.phone,
    email,
    address: data.address,
  });

  if (data.portalPassword) {
    await userRepository.create({
      name: data.fullName,
      email,
      passwordHash: await hash(data.portalPassword, 10),
      role: UserRole.CUSTOMER,
      clientId: client.id,
    });
  }

  clientLogger.info("Client created", {
    actorId,
    clientId: client.id,
    hasPortalUser: Boolean(data.portalPassword),
  });

  return client;
}

export async function updateClient(id: string, input: unknown, actorId?: string) {
  const data = updateClientSchema.parse(input);

  const client = await clientRepository.update(id, {
    fullName: data.fullName,
    localIdentifier: data.localIdentifier,
    phone: data.phone,
    email: data.email?.toLowerCase(),
    address: data.address,
  });

  clientLogger.info("Client updated", {
    actorId,
    clientId: client.id,
  });

  return client;
}
