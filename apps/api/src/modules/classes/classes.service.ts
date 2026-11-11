import { and, count, desc, eq } from "drizzle-orm";
import { db, schema } from "../../db/connection";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import type { SafeUser } from "../auth/auth.service";

export interface GetClassesQuery {
  page?: number;
  limit?: number;
}

export class ClassesService {
  /**
   * Helper to verify user membership in a class.
   */
  async verifyClassMembership(userId: string, classId: string) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const cls = await db.query.classes.findFirst({
      where: eq(schema.classes.id, classId),
    });

    if (!cls) {
      throw new NotFoundError("Kelas tidak ditemukan.");
    }

    const membership = await db.query.classMemberships.findFirst({
      where: and(
        eq(schema.classMemberships.classId, classId),
        eq(schema.classMemberships.userId, userId)
      ),
    });

    if (!membership) {
      throw new ForbiddenError(
        "Anda tidak memiliki akses ke kelas ini karena bukan anggota terdaftar."
      );
    }

    return { cls, membership };
  }

  /**
   * List all classes accessible by the current user (via class_memberships).
   */
  async getUserClasses(userId: string, query: GetClassesQuery = {}) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const offset = (page - 1) * limit;

    const [totalRecord] = await db
      .select({ total: count() })
      .from(schema.classMemberships)
      .where(eq(schema.classMemberships.userId, userId));

    const total = Number(totalRecord?.total || 0);

    const rows = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        description: schema.classes.description,
        status: schema.classes.status,
        createdAt: schema.classes.createdAt,
        updatedAt: schema.classes.updatedAt,
      })
      .from(schema.classMemberships)
      .innerJoin(
        schema.classes,
        eq(schema.classMemberships.classId, schema.classes.id)
      )
      .where(eq(schema.classMemberships.userId, userId))
      .orderBy(desc(schema.classes.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get class detail if user is an authorized member.
   */
  async getClassDetail(userId: string, classId: string) {
    const { cls } = await this.verifyClassMembership(userId, classId);

    // Get assigned teachers for context
    const teachers = await db!
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.classMemberships)
      .innerJoin(
        schema.users,
        eq(schema.classMemberships.userId, schema.users.id)
      )
      .where(
        and(
          eq(schema.classMemberships.classId, classId),
          eq(schema.users.role, "TEACHER")
        )
      );

    return {
      ...cls,
      teachers,
    };
  }

  /**
   * Get class members (teachers and students) for a teacher assigned to the class.
   */
  async getClassMembers(
    userId: string,
    userRole: string,
    classId: string
  ): Promise<{ teachers: SafeUser[]; students: SafeUser[] }> {
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      throw new ForbiddenError(
        "Hanya guru yang ditugaskan pada kelas ini yang dapat melihat daftar anggota."
      );
    }

    await this.verifyClassMembership(userId, classId);

    const members = await db!
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
      })
      .from(schema.classMemberships)
      .innerJoin(
        schema.users,
        eq(schema.classMemberships.userId, schema.users.id)
      )
      .where(eq(schema.classMemberships.classId, classId));

    return {
      teachers: members.filter((m) => m.role === "TEACHER"),
      students: members.filter((m) => m.role === "STUDENT"),
    };
  }
}

export const classesService = new ClassesService();

