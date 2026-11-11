import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../db/connection";
import { storageService } from "../../services/storage.service";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors";
import { assignmentsService } from "../assignments/assignments.service";

export interface SubmitInput {
  answerText?: string;
  file?: File;
}

export interface GradeInput {
  grade: number;
  comment?: string;
}

export class SubmissionsService {
  /**
   * Helper to verify access to a submission.
   */
  async verifySubmissionAccess(userId: string, submissionId: string) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const submission = await db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });

    if (!submission) {
      throw new NotFoundError("Submission tidak ditemukan.");
    }

    // Verify access via assignment
    const { cls, isTeacher, isStudent } =
      await assignmentsService.verifyAssignmentAccess(
        userId,
        submission.assignmentId
      );

    // If student, must be owner of this submission
    if (isStudent && submission.studentId !== userId) {
      throw new ForbiddenError(
        "Anda tidak memiliki izin untuk mengakses submission murid lain."
      );
    }

    // If teacher, must be teacher of the class
    if (!isTeacher && !isStudent) {
      throw new ForbiddenError(
        "Anda tidak memiliki izin untuk mengakses submission ini."
      );
    }

    return { submission, cls, isTeacher, isStudent };
  }

  /**
   * Get my submission for an assignment (murid).
   */
  async getMySubmission(studentUserId: string, assignmentId: string) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    // Verify student is member of this assignment's class
    await assignmentsService.verifyAssignmentAccess(
      studentUserId,
      assignmentId
    );

    const submission = await db.query.submissions.findFirst({
      where: and(
        eq(schema.submissions.assignmentId, assignmentId),
        eq(schema.submissions.studentId, studentUserId)
      ),
    });

    return submission || null;
  }

  /**
   * Create or update submission before deadline (murid).
   */
  async submitOrUpdate(
    studentUserId: string,
    studentRole: string,
    assignmentId: string,
    input: SubmitInput
  ) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    if (studentRole !== "STUDENT") {
      throw new ForbiddenError(
        "Hanya murid yang dapat mengumpulkan jawaban tugas."
      );
    }

    const { assignment } = await assignmentsService.verifyAssignmentAccess(
      studentUserId,
      assignmentId
    );

    // Strict deadline check per PRD Section 5.7 & Section 9
    const now = new Date();
    if (now > new Date(assignment.dueAt)) {
      throw new BadRequestError(
        "Batas waktu pengumpulan tugas telah berakhir. Pengiriman jawaban ditolak."
      );
    }

    // Content check: must have at least text or file
    const hasText = !!input.answerText?.trim();
    const hasFile = !!input.file && input.file.size > 0;

    if (!hasText && !hasFile) {
      throw new BadRequestError(
        "Submission harus berisi jawaban teks, berkas lampiran, atau keduanya."
      );
    }

    let uploadedFileInfo = null;
    if (hasFile) {
      uploadedFileInfo = await storageService.saveFile(input.file!);
    }

    const existingSubmission = await db.query.submissions.findFirst({
      where: and(
        eq(schema.submissions.assignmentId, assignmentId),
        eq(schema.submissions.studentId, studentUserId)
      ),
    });

    if (existingSubmission) {
      // If new file provided and old file exists, clean up old file
      if (uploadedFileInfo && existingSubmission.fileKey) {
        storageService.deleteFile(existingSubmission.fileKey).catch(() => {});
      }

      // Updating submission clears previous grade and teacher comments (PRD Section 9 & 15)
      const [updated] = await db
        .update(schema.submissions)
        .set({
          answerText: hasText
            ? input.answerText!.trim()
            : existingSubmission.answerText,
          fileKey: uploadedFileInfo
            ? uploadedFileInfo.fileKey
            : existingSubmission.fileKey,
          originalFileName: uploadedFileInfo
            ? uploadedFileInfo.originalFileName
            : existingSubmission.originalFileName,
          mimeType: uploadedFileInfo
            ? uploadedFileInfo.mimeType
            : existingSubmission.mimeType,
          fileSizeBytes: uploadedFileInfo
            ? uploadedFileInfo.fileSizeBytes
            : existingSubmission.fileSizeBytes,
          submittedAt: now,
          updatedAt: now,
          // Reset grade on revision
          grade: null,
          teacherComment: null,
          gradedBy: null,
          gradedAt: null,
        })
        .where(eq(schema.submissions.id, existingSubmission.id))
        .returning();

      return updated;
    }

    // Create fresh submission
    const [created] = await db
      .insert(schema.submissions)
      .values({
        assignmentId,
        studentId: studentUserId,
        answerText: hasText ? input.answerText!.trim() : null,
        fileKey: uploadedFileInfo ? uploadedFileInfo.fileKey : null,
        originalFileName: uploadedFileInfo
          ? uploadedFileInfo.originalFileName
          : null,
        mimeType: uploadedFileInfo ? uploadedFileInfo.mimeType : null,
        fileSizeBytes: uploadedFileInfo
          ? uploadedFileInfo.fileSizeBytes
          : null,
        submittedAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  }

  /**
   * List all submissions for an assignment (only assigned teacher).
   */
  async listSubmissionsForAssignment(
    teacherUserId: string,
    assignmentId: string
  ) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const { isTeacher } = await assignmentsService.verifyAssignmentAccess(
      teacherUserId,
      assignmentId
    );

    if (!isTeacher) {
      throw new ForbiddenError(
        "Hanya guru pada kelas tugas ini yang dapat melihat daftar submission."
      );
    }

    const rows = await db
      .select({
        id: schema.submissions.id,
        assignmentId: schema.submissions.assignmentId,
        studentId: schema.submissions.studentId,
        studentName: schema.users.name,
        studentEmail: schema.users.email,
        answerText: schema.submissions.answerText,
        originalFileName: schema.submissions.originalFileName,
        fileSizeBytes: schema.submissions.fileSizeBytes,
        submittedAt: schema.submissions.submittedAt,
        grade: schema.submissions.grade,
        teacherComment: schema.submissions.teacherComment,
        gradedAt: schema.submissions.gradedAt,
      })
      .from(schema.submissions)
      .innerJoin(
        schema.users,
        eq(schema.submissions.studentId, schema.users.id)
      )
      .where(eq(schema.submissions.assignmentId, assignmentId))
      .orderBy(desc(schema.submissions.submittedAt));

    return rows;
  }

  /**
   * Grade a submission (assigned teacher only).
   */
  async gradeSubmission(
    teacherUserId: string,
    submissionId: string,
    input: GradeInput
  ) {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const { submission, isTeacher } = await this.verifySubmissionAccess(
      teacherUserId,
      submissionId
    );

    if (!isTeacher) {
      throw new ForbiddenError(
        "Hanya guru pada kelas tugas ini yang dapat memberi nilai."
      );
    }

    if (input.grade < 0 || input.grade > 100) {
      throw new BadRequestError("Nilai harus berada dalam rentang 0 hingga 100.");
    }

    const [graded] = await db
      .update(schema.submissions)
      .set({
        grade: input.grade.toString(),
        teacherComment: input.comment?.trim() || null,
        gradedBy: teacherUserId,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.submissions.id, submission.id))
      .returning();

    return graded;
  }

  /**
   * Get submission file metadata for safe authorized streaming.
   */
  async getSubmissionFileInfo(userId: string, submissionId: string) {
    const { submission } = await this.verifySubmissionAccess(
      userId,
      submissionId
    );

    if (!submission.fileKey) {
      throw new NotFoundError(
        "Submission ini tidak memiliki berkas lampiran."
      );
    }

    const filePath = storageService.getFilePath(submission.fileKey);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      throw new NotFoundError("Berkas tidak ditemukan pada server penyimpanan.");
    }

    return {
      file,
      originalFileName: submission.originalFileName || "lampiran_tugas",
      mimeType: submission.mimeType || "application/octet-stream",
    };
  }
}

export const submissionsService = new SubmissionsService();

