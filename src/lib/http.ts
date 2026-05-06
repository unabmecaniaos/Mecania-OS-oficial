import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { normalizeError } from "@/lib/errors";
import { createLogger, logHandledError } from "@/lib/logger";

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  error: unknown,
  context?: {
    durationMs?: number;
    request?: Request;
  },
) {
  const logger = createLogger("api", {
    method: context?.request?.method,
    path: context?.request ? new URL(context.request.url).pathname : undefined,
  });

  if (error instanceof ZodError) {
    logger.warn("API validation failed", {
      durationMs: context?.durationMs,
      statusCode: 422,
      issues: error.issues.map((issue) => ({
        path: issue.path.map((segment) => String(segment)),
        message: issue.message,
      })),
    });

    return NextResponse.json(
      {
        error: error.issues[0]?.message ?? "Datos invalidos",
        details: error.issues.map((issue) => ({
          path: issue.path.map((segment) => String(segment)),
          message: issue.message,
        })),
      },
      {
        status: 422,
      },
    );
  }

  const normalized = normalizeError(error);

  logHandledError(logger, "API request failed", error, {
    durationMs: context?.durationMs,
  });

  return NextResponse.json(
    {
      error: normalized.message,
    },
    {
      status: normalized.statusCode,
    },
  );
}

export function handleApiRoute<TArgs extends [Request] | [Request, { params: Promise<Record<string, string>> }]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs) => {
    const [request] = args;
    const startedAt = Date.now();
    const url = new URL(request.url);
    const logger = createLogger("api", {
      method: request.method,
      path: url.pathname,
    });

    logger.debug("API request started", {
      search: url.search || undefined,
    });

    try {
      const response = await handler(...args);
      const durationMs = Date.now() - startedAt;
      const logContext = {
        durationMs,
        statusCode: response.status,
      };

      if (response.status >= 400) {
        logger.warn("API request completed with warning", logContext);
      } else if (request.method === "GET") {
        logger.debug("API request completed", logContext);
      } else {
        logger.info("API request completed", logContext);
      }

      return response;
    } catch (error) {
      return apiError(error, {
        request,
        durationMs: Date.now() - startedAt,
      });
    }
  };
}
