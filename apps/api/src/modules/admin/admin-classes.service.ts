import { and, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db, schema } from "../../db/connection";
import {
  BadRequestError,
  NotFoundError,
} from "../../utils/errors";
import type { SafeUser } from "../auth/auth.service";
import type { PaginationResult } from "./admin-users.service";

export interface ClassPaginationQuery {
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "ARCHIVED";
  search?: string;
}

export interface CreateClassInput {
  name: string;
  description?: string;
}

export interface UpdateClassInput {
  name?: string;
  description?: string;
  status?: "ACTIVE" | "ARCHIVED";
}

export interface ClassDetail {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdBy: string;
  creatorName?: string | null;
  creatorEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassMembersResult {
  classId: string;
  teachers: SafeUser[];
  students: SafeUser[];
}

export class AdminClassesService {
  /**
   * List all classes with pagination and status/search filters.
   */
  async listClasses(
    query: ClassPaginationQuery = {}
  ): Promise<PaginationResult<ClassDetail>> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.status) {
      conditions.push(eq(schema.classes.status, query.status));
    }

    if (query.search?.trim()) {
      conditions.push(
        ilike(schema.classes.name, `%${query.search.trim()}%`)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRecord] = await db
      .select({ total: count() })
      .from(schema.classes)
      .where(whereClause);

    const total = Number(totalRecord?.total || 0);

    const rows = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        description: schema.classes.description,
        status: schema.classes.status,
        createdBy: schema.classes.createdBy,
        creatorName: schema.users.name,
        creatorEmail: schema.users.email,
        createdAt: schema.classes.createdAt,
        updatedAt: schema.classes.updatedAt,
      })
      .from(schema.classes)
      .leftJoin(schema.users, eq(schema.classes.createdBy, schema.users.id))
      .where(whereClause)
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
   * Create a new class.
   */
  async createClass(
    adminUserId: string,
    input: CreateClassInput
  ): Promise<ClassDetail> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    if (!input.name?.trim()) {
      throw new BadRequestError("Nama kelas wajib diisi.");
    }

    const [newClass] = await db
      .insert(schema.classes)
      .values({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: "ACTIVE",
        createdBy: adminUserId,
      })
      .returning();

    return newClass;
  }

  /**
   * Get class detail by ID.
   */
  async getClassById(classId: string): Promise<ClassDetail> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const rows = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        description: schema.classes.description,
        status: schema.classes.status,
        createdBy: schema.classes.createdBy,
        creatorName: schema.users.name,
        creatorEmail: schema.users.email,
        createdAt: schema.classes.createdAt,
        updatedAt: schema.classes.updatedAt,
      })
      .from(schema.classes)
      .leftJoin(schema.users, eq(schema.classes.createdBy, schema.users.id))
      .where(eq(schema.classes.id, classId))
      .limit(1);

    if (!rows || rows.length === 0) {
      throw new NotFoundError("Kelas tidak ditemukan.");
    }

    return rows[0];
  }

  /**
   * Update class information.
   */
  async updateClass(
    classId: string,
    input: UpdateClassInput
  ): Promise<ClassDetail> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    await this.getClassById(classId);

    const updateValues: Partial<typeof schema.classes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new BadRequestError("Nama kelas tidak boleh kosong.");
      }
      updateValues.name = input.name.trim();
    }

    if (input.description !== undefined) {
      updateValues.description = input.description.trim() || null;
    }

    if (input.status !== undefined) {
      updateValues.status = input.status;
    }

    const [updated] = await db
      .update(schema.classes)
      .set(updateValues)
      .where(eq(schema.classes.id, classId))
      .returning();

    return updated;
  }

  /**
   * Get members (teachers and students) of a class.
   */
  async getClassMembers(classId: string): Promise<ClassMembersResult> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    await this.getClassById(classId);

    const members = await db
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

    const teachers = members.filter((m) => m.role === "TEACHER");
    const students = members.filter((m) => m.role === "STUDENT");

    return {
      classId,
      teachers,
      students,
    };
  }

  /**
   * Set teachers for a class.
   * Validates all IDs belong to TEACHER accounts and runs in a transaction.
   */
  async setTeachers(
    classId: string,
    teacherIds: string[]
  ): Promise<SafeUser[]> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    await this.getClassById(classId);

    // Filter duplicates
    const uniqueTeacherIds = Array.from(new Set(teacherIds));

    if (uniqueTeacherIds.length > 0) {
      const foundTeachers = await db
        .select({
          id: schema.users.id,
          role: schema.users.role,
          isActive: schema.users.isActive,
        })
        .from(schema.users)
        .where(inArray(schema.users.id, uniqueTeacherIds));

      if (foundTeachers.length !== uniqueTeacherIds.length) {
        throw new BadRequestError(
          "Satu atau beberapa ID guru tidak ditemukan di sistem."
        );
      }

      const invalidRole = foundTeachers.find((u) => u.role !== "TEACHER");
      if (invalidRole) {
        throw new BadRequestError(
          "Pengguna yang ditetapkan sebagai guru kelas harus memiliki role TEACHER."
        );
      }
    }

    // Execute in transaction
    await db.transaction(async (tx) => {
      // 1. Get current memberships for this class that belong to TEACHER users
      const currentTeacherMemberships = await tx
        .select({ membershipId: schema.classMemberships.id })
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

      // 2. Delete existing teacher memberships
      if (currentTeacherMemberships.length > 0) {
        const idsToDelete = currentTeacherMemberships.map(
          (m) => m.membershipId
        );
        await tx
          .delete(schema.classMemberships)
          .where(inArray(schema.classMemberships.id, idsToDelete));
      }

      // 3. Insert new teacher memberships
      if (uniqueTeacherIds.length > 0) {
        await tx.insert(schema.classMemberships).values(
          uniqueTeacherIds.map((userId) => ({
            classId,
            userId,
          }))
        );
      }
    });

    const updatedMembers = await this.getClassMembers(classId);
    return updatedMembers.teachers;
  }

  /**
   * Set students for a class.
   * Validates all IDs belong to STUDENT accounts and runs in a transaction.
   */
  async setStudents(
    classId: string,
    studentIds: string[]
  ): Promise<SafeUser[]> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    await this.getClassById(classId);

    // Filter duplicates
    const uniqueStudentIds = Array.from(new Set(studentIds));

    if (uniqueStudentIds.length > 0) {
      const foundStudents = await db
        .select({
          id: schema.users.id,
          role: schema.users.role,
        })
        .from(schema.users)
        .where(inArray(schema.users.id, uniqueStudentIds));

      if (foundStudents.length !== uniqueStudentIds.length) {
        throw new BadRequestError(
          "Satu atau beberapa ID murid tidak ditemukan di sistem."
        );
      }

      const invalidRole = foundStudents.find((u) => u.role !== "STUDENT");
      if (invalidRole) {
        throw new BadRequestError(
          "Pengguna yang didaftarkan ke kelas harus memiliki role STUDENT."
        );
      }
    }

    // Execute in transaction
    await db.transaction(async (tx) => {
      // 1. Get current memberships for this class that belong to STUDENT users
      const currentStudentMemberships = await tx
        .select({ membershipId: schema.classMemberships.id })
        .from(schema.classMemberships)
        .innerJoin(
          schema.users,
          eq(schema.classMemberships.userId, schema.users.id)
        )
        .where(
          and(
            eq(schema.classMemberships.classId, classId),
            eq(schema.users.role, "STUDENT")
          )
        );

      // 2. Delete existing student memberships
      if (currentStudentMemberships.length > 0) {
        const idsToDelete = currentStudentMemberships.map(
          (m) => m.membershipId
        );
        await tx
          .delete(schema.classMemberships)
          .where(inArray(schema.classMemberships.id, idsToDelete));
      }

      // 3. Insert new student memberships
      if (uniqueStudentIds.length > 0) {
        await tx.insert(schema.classMemberships).values(
          uniqueStudentIds.map((userId) => ({
            classId,
            userId,
          }))
        );
      }
    });

    const updatedMembers = await this.getClassMembers(classId);
    return updatedMembers.students;
  }
}

export const adminClassesService = new AdminClassesService();

