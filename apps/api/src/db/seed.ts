import "../env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const ADMIN_NAME = process.env.ADMIN_NAME || "Administrator";
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "admin@lms.local"
).toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

async function runSeed() {
  console.log("🌱 Running database seeder...");
  const client = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const existingAdmin = await db.query.users.findFirst({
      where: eq(schema.users.email, ADMIN_EMAIL),
    });

    if (existingAdmin) {
      console.log(`ℹ Admin user with email "${ADMIN_EMAIL}" already exists.`);
    } else {
      const passwordHash = await Bun.password.hash(ADMIN_PASSWORD, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 3,
      });

      const [newAdmin] = await db
        .insert(schema.users)
        .values({
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          passwordHash,
          role: "ADMIN",
          isActive: true,
        })
        .returning({ id: schema.users.id, email: schema.users.email });

      console.log(
        `✓ Seeded initial Admin user: ${newAdmin.email} (ID: ${newAdmin.id})`
      );
      console.log(`  Default password: ${ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();

