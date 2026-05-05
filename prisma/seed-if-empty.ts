import { PrismaClient } from "@prisma/client";

import { seedDemoData } from "./seed";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

async function main() {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    console.log(`Seed demo omitido: la base ya tiene ${userCount} usuario(s).`);
    return;
  }

  console.log("Base vacia detectada. Cargando datos demo locales...");
  await prisma.$disconnect();
  await seedDemoData();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
