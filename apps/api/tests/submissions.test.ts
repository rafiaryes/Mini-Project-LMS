import { describe, expect, it } from "bun:test";
import { app } from "../src/index";
import { storageService } from "../src/services/storage.service";

describe("Submissions - Unauthenticated Access Protection", () => {
  const dummyUUID = "33333333-3333-3333-3333-333333333333";

  it("GET /api/v1/assignments/:id/my-submission should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/api/v1/assignments/${dummyUUID}/my-submission`,
        { method: "GET" }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("PUT /api/v1/assignments/:id/my-submission should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/api/v1/assignments/${dummyUUID}/my-submission`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answerText: "Jawaban saya" }),
        }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/assignments/:id/submissions should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/api/v1/assignments/${dummyUUID}/submissions`,
        { method: "GET" }
      )
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/submissions/:id should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/submissions/${dummyUUID}`, {
        method: "GET",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("PATCH /api/v1/submissions/:id/grade should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/submissions/${dummyUUID}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: 85, comment: "Bagus" }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/submissions/:id/file should reject unauthenticated request with 401", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/submissions/${dummyUUID}/file`, {
        method: "GET",
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Submissions - Grade Validation & Storage Utilities", () => {
  const dummyUUID = "33333333-3333-3333-3333-333333333333";

  it("PATCH /api/v1/submissions/:id/grade should reject grade < 0 with 400", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/submissions/${dummyUUID}/grade`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer fake-token",
        },
        body: JSON.stringify({ grade: -10 }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("PATCH /api/v1/submissions/:id/grade should reject grade > 100 with 400", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/submissions/${dummyUUID}/grade`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer fake-token",
        },
        body: JSON.stringify({ grade: 120 }),
      })
    );

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("storageService.getFilePath should sanitize fileKey against directory traversal", () => {
    const safePath = storageService.getFilePath("../../etc/passwd");
    expect(safePath.includes("..")).toBeFalse();
  });
});

