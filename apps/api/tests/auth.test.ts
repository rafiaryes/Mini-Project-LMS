import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { app } from "../src/index";
import { authPlugin } from "../src/middleware/auth.middleware";
import {
  generateSessionToken,
  hashToken,
  SESSION_COOKIE_NAME,
} from "../src/modules/auth/auth.utils";
import { errorPlugin } from "../src/plugins/error.plugin";

describe("Auth Utilities", () => {
  it("generateSessionToken should generate high-entropy 64-char hex strings", () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    expect(/^[a-f0-9]{64}$/.test(token1)).toBeTrue();
  });

  it("hashToken should generate consistent SHA-256 hash", () => {
    const token = "test-session-token-123456";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash1)).toBeTrue();
  });
});

describe("Auth Endpoints - Input Validation & Guards", () => {
  it("POST /api/v1/auth/login should reject invalid email format with 400", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "password123",
        }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/v1/auth/login should reject empty body with 400", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/auth/me should return 401 UNAUTHORIZED when no session provided", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/auth/me", {
        method: "GET",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toContain("Autentikasi diperlukan");
  });

  it("POST /api/v1/auth/logout should return 401 UNAUTHORIZED when no session provided", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "POST",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/auth/me should reject invalid Bearer token with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-fake-token-99999",
        },
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/auth/me should reject invalid cookie token with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/auth/me", {
        method: "GET",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=invalid-fake-cookie-99999`,
        },
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("RBAC Role Guards", () => {
  // Test role guard using a dedicated test Elysia instance
  const testApp = new Elysia()
    .use(errorPlugin)
    .use(authPlugin)
    // Simulated authenticated context for testing role checks
    .group("/admin-only", (g) =>
      g
        .derive(({ headers }) => {
          const role = headers["x-mock-role"] as
            | "ADMIN"
            | "TEACHER"
            | "STUDENT"
            | undefined;
          return {
            currentUser: role
              ? {
                  id: "mock-user-id",
                  name: "Mock User",
                  email: "mock@example.com",
                  role,
                }
              : null,
          };
        })
        .get(
          "/dashboard",
          () => ({
            data: { secret: "admin-secret-data" },
          }),
          {
            requireRoles: ["ADMIN"],
          }
        )
    );

  it("should block unauthenticated request with 401 UNAUTHORIZED", async () => {
    const response = await testApp.handle(
      new Request("http://localhost/admin-only/dashboard")
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("should block TEACHER role from ADMIN endpoint with 403 FORBIDDEN", async () => {
    const response = await testApp.handle(
      new Request("http://localhost/admin-only/dashboard", {
        headers: { "x-mock-role": "TEACHER" },
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.message).toContain("Anda tidak memiliki izin");
  });

  it("should block STUDENT role from ADMIN endpoint with 403 FORBIDDEN", async () => {
    const response = await testApp.handle(
      new Request("http://localhost/admin-only/dashboard", {
        headers: { "x-mock-role": "STUDENT" },
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("should allow ADMIN role to access ADMIN endpoint with 200 OK", async () => {
    const response = await testApp.handle(
      new Request("http://localhost/admin-only/dashboard", {
        headers: { "x-mock-role": "ADMIN" },
      })
    );

    const body = (await response.json()) as {
      data: { secret: string };
    };

    expect(response.status).toBe(200);
    expect(body.data.secret).toBe("admin-secret-data");
  });
});
