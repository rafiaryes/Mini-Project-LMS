import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("GET /api/health", () => {
  it("should return status ok", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );
    const body = (await response.json()) as {
      status: string;
      timestamp: string;
      services: { api: boolean; database: boolean };
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.services.api).toBe(true);
    expect(body.timestamp).toBeDefined();
  });
});
