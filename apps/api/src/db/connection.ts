import "../env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    "⚠ DATABASE_URL is not set. Database features will not work."
  );
}

/**
 * Raw PostgreSQL connection instance using postgres.js.
 * Returns null if DATABASE_URL is not configured.
 */
export const sql = DATABASE_URL
  ? postgres(DATABASE_URL, { max: 10 })
  : null;

/**
 * Drizzle ORM instance with full schema and relations.
 * Returns null if DATABASE_URL is not configured.
 */
export const db = sql ? drizzle(sql, { schema }) : null;

/**
 * Test the database connection.
 * Returns true if connection is successful, false otherwise.
 */
export async function testConnection(): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export { schema };
