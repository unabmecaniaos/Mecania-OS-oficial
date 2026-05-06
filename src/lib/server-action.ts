import type { ActionState } from "@/lib/form-state";
import { getErrorMessage } from "@/lib/errors";
import { createLogger, logHandledError } from "@/lib/logger";
import { revalidateApplicationData } from "@/lib/revalidation";

type ActionExecutionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      state: ActionState;
    };

export async function executeServerAction<T>(
  actionName: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<ActionExecutionResult<T>> {
  const startedAt = Date.now();
  const logger = createLogger("action", {
    action: actionName,
    ...context,
  });

  logger.debug("Server action started");

  try {
    const data = await operation();

    revalidateApplicationData();

    logger.info("Server action completed", {
      durationMs: Date.now() - startedAt,
    });

    return {
      ok: true,
      data,
    };
  } catch (error) {
    logHandledError(logger, "Server action failed", error, {
      durationMs: Date.now() - startedAt,
    });

    return {
      ok: false,
      state: {
        error: getErrorMessage(error),
      },
    };
  }
}
