import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../db/connection";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors";
import { classesService } from "../classes/classes.service";

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  dueAt: string | Date;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  dueAt?: string | Date;
}

export class AssignmentsService {
  /**
   * Helper to verify user access to an assignment through its parent class.
   */
  async verifyAssignmentAccess(userId: string, assignmentId: string) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(schema.assignments.id, assignmentId),
    });

    if (!assignment) {
      throw new NotFoundError("Tugas tidak ditemukan.");
    }

    // Verify membership in the owning class
    const { cls, membership } = await classesService.verifyClassMembership(
      userId,
      assignment.classId
    );

    // Get user details to know role in this class
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    return {
      assignment,
      cls,
      membership,
      user,
      isTeacher: user?.role === "TEACHER",
      isStudent: user?.role === "STUDENT",
    };
  }

  /**
   * List assignments for a class (requires class membership).
   */
  async listClassAssignments(
    userId: string,
    userRole: string,
    classId: string
  ) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    // Verify user is in this class
    await classesService.verifyClassMembership(userId, classId);

    // Students only see non-archived assignments by default
    const conditions = [eq(schema.assignments.classId, classId)];
    if (userRole === "STUDENT") {
      conditions.push(eq(schema.assignments.isArchived, false));
    }

    const rows = await db
      .select({
        id: schema.assignments.id,
        classId: schema.assignments.classId,
        title: schema.assignments.title,
        description: schema.assignments.description,
        dueAt: schema.assignments.dueAt,
        isArchived: schema.assignments.isArchived,
        createdBy: schema.assignments.createdBy,
        creatorName: schema.users.name,
        createdAt: schema.assignments.createdAt,
        updatedAt: schema.assignments.updatedAt,
      })
      .from(schema.assignments)
      .leftJoin(schema.users, eq(schema.assignments.createdBy, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.assignments.dueAt));

    return rows;
  }

  /**
   * Create assignment (only assigned teacher of the class).
   */
  async createAssignment(
    teacherUserId: string,
    teacherRole: string,
    classId: string,
    input: CreateAssignmentInput
  ) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    if (teacherRole !== "TEACHER" && teacherRole !== "ADMIN") {
      throw new ForbiddenError(
        "Hanya guru yang ditugaskan pada kelas ini yang dapat membuat tugas."
      );
    }

    // Verify teacher is assigned to this class
    await classesService.verifyClassMembership(teacherUserId, classId);

    if (!input.title?.trim()) {
      throw new BadRequestError("Judul tugas wajib diisi.");
    }

    const dueDate = new Date(input.dueAt);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestError(
        "Format batas waktu (dueAt) tidak valid. Gunakan format ISO 8601."
      );
    }

    const [newAssignment] = await db
      .insert(schema.assignments)
      .values({
        classId,
        createdBy: teacherUserId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueAt: dueDate,
        isArchived: false,
      })
      .returning();

    return newAssignment;
  }

  /**
   * Get assignment detail (teachers or enrolled students of the class).
   */
  async getAssignmentDetail(userId: string, assignmentId: string) {
    const { assignment, cls, isStudent } =
      await this.verifyAssignmentAccess(userId, assignmentId);

    // If student, check if they already submitted
    let mySubmission = null;
    if (isStudent && db) {
      mySubmission = await db.query.submissions.findFirst({
        where: and(
          eq(schema.submissions.assignmentId, assignmentId),
          eq(schema.submissions.studentId, userId)
        ),
      });
    }

    return {
      ...assignment,
      className: cls.name,
      mySubmission: mySubmission
        ? {
            id: mySubmission.id,
            submittedAt: mySubmission.submittedAt,
            hasText: !!mySubmission.answerText,
            hasFile: !!mySubmission.fileKey,
            grade: mySubmission.grade,
            teacherComment: mySubmission.teacherComment,
          }
        : null,
    };
  }

  /**
   * Update assignment (only assigned teacher of the class).
   */
  async updateAssignment(
    teacherUserId: string,
    assignmentId: string,
    input: UpdateAssignmentInput
  ) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const { isTeacher } = await this.verifyAssignmentAccess(
      teacherUserId,
      assignmentId
    );

    if (!isTeacher) {
      throw new ForbiddenError(
        "Hanya guru pada kelas tugas ini yang dapat mengubah tugas."
      );
    }

    const updateValues: Partial<typeof schema.assignments.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new BadRequestError("Judul tugas tidak boleh kosong.");
      }
      updateValues.title = input.title.trim();
    }

    if (input.description !== undefined) {
      updateValues.description = input.description.trim() || null;
    }

    if (input.dueAt !== undefined) {
      const dueDate = new Date(input.dueAt);
      if (isNaN(dueDate.getTime())) {
        throw new BadRequestError("Format batas waktu (dueAt) tidak valid.");
      }
      updateValues.dueAt = dueDate;
    }

    const [updated] = await db
      .update(schema.assignments)
      .set(updateValues)
      .where(eq(schema.assignments.id, assignmentId))
      .returning();

    return updated;
  }

  /**
   * Archive assignment (only assigned teacher).
   */
  async archiveAssignment(teacherUserId: string, assignmentId: string) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const { isTeacher } = await this.verifyAssignmentAccess(
      teacherUserId,
      assignmentId
    );

    if (!isTeacher) {
      throw new ForbiddenError(
        "Hanya guru pada kelas tugas ini yang dapat mengarsipkan tugas."
      );
    }

    const [archived] = await db
      .update(schema.assignments)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(schema.assignments.id, assignmentId))
      .returning();

    return archived;
  }
}

export const assignmentsService = new AssignmentsService();

