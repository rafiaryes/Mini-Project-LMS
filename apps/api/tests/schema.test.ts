import { describe, expect, it } from "bun:test";
import { getTableColumns } from "drizzle-orm";
import * as schema from "../src/db/schema";

describe("Database Schema Definitions", () => {
  it("should have all 6 core tables defined", () => {
    expect(schema.users).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.classes).toBeDefined();
    expect(schema.classMemberships).toBeDefined();
    expect(schema.assignments).toBeDefined();
    expect(schema.submissions).toBeDefined();
  });

  it("users table should have required columns per PRD", () => {
    const columns = getTableColumns(schema.users);
    expect(columns.id).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.email).toBeDefined();
    expect(columns.passwordHash).toBeDefined();
    expect(columns.role).toBeDefined();
    expect(columns.isActive).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("submissions table should have required columns per PRD", () => {
    const columns = getTableColumns(schema.submissions);
    expect(columns.id).toBeDefined();
    expect(columns.assignmentId).toBeDefined();
    expect(columns.studentId).toBeDefined();
    expect(columns.answerText).toBeDefined();
    expect(columns.fileKey).toBeDefined();
    expect(columns.grade).toBeDefined();
    expect(columns.teacherComment).toBeDefined();
    expect(columns.gradedBy).toBeDefined();
    expect(columns.gradedAt).toBeDefined();
  });

  it("should support Argon2id password hashing via Bun.password", async () => {
    const plain = "SecretAdminPassword123!";
    const hash = await Bun.password.hash(plain, {
      algorithm: "argon2id",
    });

    expect(hash).toBeString();
    expect(hash.startsWith("$argon2id$")).toBeTrue();

    const isValid = await Bun.password.verify(plain, hash);
    expect(isValid).toBeTrue();

    const isInvalid = await Bun.password.verify("WrongPassword", hash);
    expect(isInvalid).toBeFalse();
  });
});

