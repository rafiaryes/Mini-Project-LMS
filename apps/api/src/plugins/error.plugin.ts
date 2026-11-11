import type { Elysia } from "elysia";
import { AppError } from "../utils/errors";

export const errorPlugin = (app: Elysia) =>
  app.onError(({ code, error, set }) => {
    // 1. Custom application errors (Unauthorized, Forbidden, NotFound, etc.)
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    // 2. Schema validation errors
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: {
          code: "VALIDATION_ERROR",
          message:
            error.message || "Data masukan tidak memenuhi format yang valid.",
        },
      };
    }

    // 3. 404 Not Found
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: {
          code: "NOT_FOUND",
          message: "Resource atau endpoint tidak ditemukan.",
        },
      };
    }

    // 4. Fallback for unexpected errors (do not leak internal details)
    console.error("Unhandled error:", error);
    set.status = 500;
    return {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan internal pada server.",
      },
    };
  });
