import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Classes & Assignments - Unauthenticated Access Protection", () => {
  it("GET /api/v1/classes should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/classes", {
        method: "GET",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/classes/:classId should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/classes/11111111-1111-1111-1111-111111111111",
        {
          method: "GET",
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/classes/:classId/assignments should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/classes/11111111-1111-1111-1111-111111111111/assignments",
        {
          method: "GET",
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/classes/:classId/assignments should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/classes/11111111-1111-1111-1111-111111111111/assignments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Tugas 1",
            dueAt: new Date().toISOString(),
          }),
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/assignments/:assignmentId should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/assignments/22222222-2222-2222-2222-222222222222",
        {
          method: "GET",
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("PATCH /api/v1/assignments/:assignmentId should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/assignments/22222222-2222-2222-2222-222222222222",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Tugas Diubah" }),
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/assignments/:assignmentId/archive should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/assignments/22222222-2222-2222-2222-222222222222/archive",
        {
          method: "POST",
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Classes & Assignments - Input Validation", () => {
  it("POST /api/v1/classes/:classId/assignments should validate empty title with 400", async () => {
    const response = await app.handle(
      new Request(
        "http://localhost/api/v1/classes/11111111-1111-1111-1111-111111111111/assignments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer fake-token",
          },
          body: JSON.stringify({
            title: "",
            dueAt: new Date().toISOString(),
          }),
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

