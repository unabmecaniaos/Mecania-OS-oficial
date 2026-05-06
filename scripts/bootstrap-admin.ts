import { hash } from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrador";
const liquidatorEmail = process.env.BOOTSTRAP_LIQUIDATOR_EMAIL?.trim().toLowerCase();
const liquidatorPassword = process.env.BOOTSTRAP_LIQUIDATOR_PASSWORD?.trim();
const liquidatorName = process.env.BOOTSTRAP_LIQUIDATOR_NAME?.trim() || "Liquidador";

async function upsertBootstrapUser(input: {
  email?: string;
  name: string;
  password?: string;
  role: UserRole;
  label: string;
}) {
  if (!input.email || !input.password) {
    console.log(`Bootstrap ${input.label} omitido: faltan variables.`);
    return;
  }

  if (input.password.length < 8) {
    throw new Error(`La password de ${input.label} debe tener al menos 8 caracteres.`);
  }

  const existing = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existing) {
    if (existing.role !== input.role) {
      throw new Error(`Ya existe un usuario con el correo de ${input.label} y otro rol.`);
    }

    if (!existing.active || existing.name !== input.name) {
      await prisma.user.update({
        where: {
          id: existing.id,
        },
        data: {
          name: input.name,
          active: true,
        },
      });
    }

    console.log(`Bootstrap ${input.label} listo: ${input.email}`);
    return;
  }

  await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hash(input.password, 10),
      role: input.role,
      active: true,
    },
  });

  console.log(`Bootstrap ${input.label} creado: ${input.email}`);
}

async function main() {
  await upsertBootstrapUser({
    email: adminEmail,
    name: adminName,
    password: adminPassword,
    role: UserRole.ADMIN,
    label: "admin",
  });
  await upsertBootstrapUser({
    email: liquidatorEmail,
    name: liquidatorName,
    password: liquidatorPassword,
    role: UserRole.LIQUIDATOR,
    label: "liquidador",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
