import { UserRole } from "@prisma/client";
import { z } from "zod";

import { optionalText, requiredText } from "@/lib/validation";

const managedRoleSchema = z.enum([UserRole.ADMIN, UserRole.MECHANIC, UserRole.CUSTOMER]);

export const listUsersFiltersSchema = z.object({
  q: optionalText(120),
  role: managedRoleSchema.optional(),
});

export const createManagedUserSchema = z.object({
  name: requiredText(3, 120),
  email: z.string().trim().email(),
  password: requiredText(8, 128),
  role: managedRoleSchema,
  clientId: optionalText(40),
});

export const updateManagedUserSchema = z.object({
  name: requiredText(3, 120),
  email: z.string().trim().email(),
  role: managedRoleSchema,
  active: z.boolean(),
  password: optionalText(128),
  clientId: optionalText(40),
});
