import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "../../db/connection";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../utils/errors";
import type { SafeUser } from "../auth/auth.service";

export interface PaginationQuery {
  page?: number;
  limit?: number;
  role?: "ADMIN" | "TEACHER" | "STUDENT";
  search?: string;
  isActive?: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

export interface UpdateUserInput {
  name?: string;
  role?: "ADMIN" | "TEACHER" | "STUDENT";
  isActive?: boolean;
}

export class AdminUsersService {
  /**
   * List users with pagination, role filter, and name/email search.
   */
  async listUsers(
    query: PaginationQuery = {}
  ): Promise<PaginationResult<SafeUser>> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.role) {
      conditions.push(eq(schema.users.role, query.role));
    }

    if (typeof query.isActive === "boolean") {
      conditions.push(eq(schema.users.isActive, query.isActive));
    }

    if (query.search?.trim()) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.users.name, searchPattern),
          ilike(schema.users.email, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count query
    const [totalRecord] = await db
      .select({ total: count() })
      .from(schema.users)
      .where(whereClause);

    const total = Number(totalRecord?.total || 0);

    // Data query (strictly omit password_hash)
    const items = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Create a new user account with hashed password.
   */
  async createUser(input: CreateUserInput): Promise<SafeUser> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const email = input.email.trim().toLowerCase();

    // Check unique email
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existing) {
      throw new ConflictError(
        `Email "${email}" sudah terdaftar pada pengguna lain.`
      );
    }

    // Hash password with Argon2id
    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });

    const [newUser] = await db
      .insert(schema.users)
      .values({
        name: input.name.trim(),
        email,
        passwordHash,
        role: input.role,
        isActive: true,
      })
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    return newUser;
  }

  /**
   * Get user detail by ID (never returns password_hash).
   */
  async getUserById(userId: string): Promise<SafeUser> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const user = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      throw new NotFoundError("Pengguna tidak ditemukan.");
    }

    return user[0];
  }

  /**
   * Update user details (name, role, or active status).
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<SafeUser> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    await this.getUserById(userId);

    const updateValues: Partial<typeof schema.users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new BadRequestError("Nama pengguna tidak boleh kosong.");
      }
      updateValues.name = input.name.trim();
    }

    if (input.role !== undefined) {
      updateValues.role = input.role;
    }

    if (input.isActive !== undefined) {
      updateValues.isActive = input.isActive;

      // If deactivated, revoke all active sessions immediately
      if (!input.isActive) {
        await db
          .delete(schema.sessions)
          .where(eq(schema.sessions.userId, userId));
      }
    }

    const [updatedUser] = await db
      .update(schema.users)
      .set(updateValues)
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    return updatedUser;
  }

  /**
   * Deactivate user and revoke all sessions.
   */
  async deactivateUser(userId: string): Promise<SafeUser> {
    return this.updateUser(userId, { isActive: false });
  }
}

export const adminUsersService = new AdminUsersService();

