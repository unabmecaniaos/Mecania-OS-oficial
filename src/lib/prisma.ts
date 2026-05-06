import { Prisma, PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

declare global {
  var prisma: PrismaClient<Prisma.PrismaClientOptions, "query" | "warn" | "error"> | undefined;
}

const prismaLogger = createLogger("prisma");

const prismaLogConfig: Prisma.LogDefinition[] =
  env.NODE_ENV === "development"
    ? [
        { emit: "event", level: "query" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ]
    : [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ];

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: prismaLogConfig,
  });

if (env.NODE_ENV === "development") {
  prisma.$on("query", (event) => {
    prismaLogger.debug("Prisma query executed", {
      durationMs: event.duration,
      query: event.query.replace(/\s+/g, " ").trim().slice(0, 240),
      target: event.target,
    });
  });
}

prisma.$on("warn", (event) => {
  prismaLogger.warn("Prisma warning event", {
    message: event.message,
    target: event.target,
    timestamp: event.timestamp,
  });
});

prisma.$on("error", (event) => {
  prismaLogger.error("Prisma error event", {
    message: event.message,
    target: event.target,
    timestamp: event.timestamp,
  });
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
