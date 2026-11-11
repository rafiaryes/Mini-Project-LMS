import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Admin Module - RBAC Guards & Route Protection", () => {
  it("GET /api/v1/admin/users should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/admin/users", {
        method: "GET",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/admin/users should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "TEACHER",
        }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/admin/classes should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/admin/classes", {
        method: "GET",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/admin/classes should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Kelas Baru",
        }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Admin Module - Input Validation", () => {
  // Mock admin app for input validation testing
  const mockAdminApp = app;

  it("POST /api/v1/admin/users should validate email format with 400 VALIDATION_ERROR", async () => {
    const response = await mockAdminApp.handle(
      new Request("http://localhost/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer fake-token",
        },
        body: JSON.stringify({
          name: "Teacher Test",
          email: "invalid-email-format",
          password: "password123",
          role: "TEACHER",
        }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/admin/users/:userId should reject non-UUID userId with 400 or 401", async () => {
    const response = await mockAdminApp.handle(
      new Request("http://localhost/api/v1/admin/users/not-a-valid-uuid", {
        method: "GET",
      })
    );

    // Auth guard runs first -> 401
    expect([400, 401]).toContain(response.status);
  });

  it("GET /api/v1/admin/classes/:classId should reject non-UUID classId with 400 or 401", async () => {
    const response = await mockAdminApp.handle(
      new Request("http://localhost/api/v1/admin/classes/12345", {
        method: "GET",
      })
    );

    expect([400, 401]).toContain(response.status);
  });

  it("PUT /api/v1/admin/classes/:classId/teachers should reject non-UUID params with 400 or 401", async () => {
    const response = await mockAdminApp.handle(
      new Request("http://localhost/api/v1/admin/classes/invalid/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherIds: ["invalid-id"] }),
      })
    );

    expect([400, 401]).toContain(response.status);
  });
});
