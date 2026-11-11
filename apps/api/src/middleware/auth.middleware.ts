import { Elysia } from "elysia";
import { authService, type SafeUser } from "../modules/auth/auth.service";
import { SESSION_COOKIE_NAME } from "../modules/auth/auth.utils";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export const authContext = new Elysia({ name: "auth.context" }).derive(
  { as: "global" },
  async ({ cookie, headers }) => {
    const cookieToken = cookie[SESSION_COOKIE_NAME]?.value as string | undefined;
    const headerToken = headers.authorization?.startsWith("Bearer ")
      ? headers.authorization.slice(7)
      : undefined;

    const rawToken = cookieToken || headerToken;

    if (!rawToken) {
      return {
        currentUser: null as SafeUser | null,
        rawSessionToken: null as string | null,
      };
    }

    const sessionData = await authService.validateSession(rawToken);

    return {
      currentUser: sessionData?.user ?? null,
      rawSessionToken: rawToken,
    };
  }
);

export const authPlugin = new Elysia({ name: "auth.plugin" })
  .use(authContext)
  .macro({
    requireAuth(enabled: boolean) {
      if (!enabled) return;
      return {
        beforeHandle({ currentUser }) {
          if (!currentUser) {
            throw new UnauthorizedError(
              "Autentikasi diperlukan. Silakan login terlebih dahulu."
            );
          }
        },
      };
    },
    requireRoles(roles: Role[]) {
      return {
        beforeHandle({ currentUser }) {
          if (!currentUser) {
            throw new UnauthorizedError(
              "Autentikasi diperlukan. Silakan login terlebih dahulu."
            );
          }
          if (!roles.includes(currentUser.role)) {
            throw new ForbiddenError(
              "Anda tidak memiliki izin untuk mengakses resource ini."
            );
          }
        },
      };
    },
  });

