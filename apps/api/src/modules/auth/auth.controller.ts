import { Elysia, t } from "elysia";
import { authPlugin } from "../../middleware/auth.middleware";
import { authService } from "./auth.service";
import { SESSION_COOKIE_NAME } from "./auth.utils";

export const authController = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  // POST /auth/login
  .post(
    "/login",
    async ({ body, cookie }) => {
      const { user, rawToken, expiresAt } = await authService.login(
        body.email,
        body.password
      );

      // Set HttpOnly session cookie
      cookie[SESSION_COOKIE_NAME].set({
        value: rawToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });

      return {
        data: user,
      };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Format email tidak valid.",
        }),
        password: t.String({
          minLength: 1,
          error: "Kata sandi wajib diisi.",
        }),
      }),
    }
  )
  // POST /auth/logout
  .post(
    "/logout",
    async ({ rawSessionToken, cookie }) => {
      if (rawSessionToken) {
        await authService.logout(rawSessionToken);
      }

      cookie[SESSION_COOKIE_NAME].remove();

      return {
        data: {
          message: "Berhasil logout.",
        },
      };
    },
    {
      requireAuth: true,
    }
  )
  // GET /auth/me
  .get(
    "/me",
    ({ currentUser }) => {
      return {
        data: currentUser,
      };
    },
    {
      requireAuth: true,
    }
  );

