import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Automatically loads .env file if DATABASE_URL or SESSION_SECRET is not yet loaded in process.env.
 * Checks the current working directory as well as parent monorepo directories.
 * Skips auto-loading when running unit tests under test environment.
 */
if (process.env.NODE_ENV !== "test" && (!process.env.DATABASE_URL || !process.env.SESSION_SECRET)) {
  const candidatePaths = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
    resolve(__dirname, "../../.env"),
    resolve(__dirname, "../../../.env"),
  ];

  for (const envPath of candidatePaths) {
    if (existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        if (process.env.DATABASE_URL) {
          break;
        }
      } catch {
        // Continue searching
      }
    }
  }
}
