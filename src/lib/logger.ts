import { Prisma } from "@prisma/client";

import { env } from "@/lib/env";
import { normalizeError } from "@/lib/errors";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type LogPayload = {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  context?: LogContext;
  error?: ReturnType<typeof serializeError>;
};

type Logger = {
  child: (context: LogContext) => Logger;
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  captureError: (message: string, error: unknown, context?: LogContext) => void;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getMinimumLogLevel(): LogLevel {
  if (env.LOG_LEVEL) {
    return env.LOG_LEVEL;
  }

  return env.NODE_ENV === "development" ? "debug" : "info";
}

function shouldLog(level: LogLevel) {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[getMinimumLogLevel()];
}

function sanitizeContext(context: LogContext | undefined) {
  if (!context) {
    return undefined;
  }

  const entries = Object.entries(context).flatMap(([key, value]) => {
    if (value === undefined) {
      return [];
    }

    return [[key, sanitizeValue(value)] as const];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, entry]) => {
        if (entry === undefined) {
          return [];
        }

        return [[key, sanitizeValue(entry)] as const];
      }),
    );
  }

  return value;
}

function serializeError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: sanitizeValue(error.meta),
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error",
    value: sanitizeValue(error),
  };
}

function writeLog(payload: LogPayload) {
  const line = JSON.stringify(payload);

  switch (payload.level) {
    case "debug":
      console.debug(line);
      return;
    case "info":
      console.info(line);
      return;
    case "warn":
      console.warn(line);
      return;
    case "error":
      console.error(line);
      return;
  }
}

export function createLogger(scope: string, baseContext?: LogContext): Logger {
  function log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    if (!shouldLog(level)) {
      return;
    }

    writeLog({
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      context: sanitizeContext({
        ...baseContext,
        ...context,
      }),
      error: error === undefined ? undefined : serializeError(error),
    });
  }

  return {
    child(context) {
      return createLogger(scope, {
        ...baseContext,
        ...context,
      });
    },
    debug(message, context) {
      log("debug", message, context);
    },
    info(message, context) {
      log("info", message, context);
    },
    warn(message, context) {
      log("warn", message, context);
    },
    error(message, context) {
      log("error", message, context);
    },
    captureError(message, error, context) {
      log("error", message, context, error);
    },
  };
}

export function logHandledError(logger: Logger, message: string, error: unknown, context?: LogContext) {
  const normalized = normalizeError(error);
  const errorContext = {
    ...context,
    statusCode: normalized.statusCode,
    errorMessage: normalized.message,
  };

  if (normalized.statusCode >= 500) {
    logger.captureError(message, error, errorContext);
    return;
  }

  logger.warn(message, errorContext);
}
