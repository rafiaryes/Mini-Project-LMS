import { randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "lms_session";
// 7 days in milliseconds
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates a high-entropy random string (64 hex characters from 32 random bytes).
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generates a SHA-256 hash of the given token to be stored in the database.
 * We never store raw session tokens in the database.
 */
export function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

