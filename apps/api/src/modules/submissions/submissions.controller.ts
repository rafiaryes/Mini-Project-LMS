import { Elysia, t } from "elysia";
import { authPlugin } from "../../middleware/auth.middleware";
import { submissionsService } from "./submissions.service";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const submissionsController = new Elysia()
  .use(authPlugin)
  .guard({
    requireAuth: true,
  })
  // ── Submissions on Assignments ────────────────────────────────────
  // GET /assignments/:assignmentId/my-submission
  .get(
    "/assignments/:assignmentId/my-submission",
    async ({ currentUser, params }) => {
      const submission = await submissionsService.getMySubmission(
        currentUser!.id,
        params.assignmentId
      );

      return {
        data: submission,
      };
    },
    {
      params: t.Object({
        assignmentId: t.RegExp(uuidRegex, {
          error: "ID tugas harus berupa UUID valid.",
        }),
      }),
    }
  )
  // PUT /assignments/:assignmentId/my-submission (JSON or multipart/form-data)
  .put(
    "/assignments/:assignmentId/my-submission",
    async ({ currentUser, params, body }) => {
      const submission = await submissionsService.submitOrUpdate(
        currentUser!.id,
        currentUser!.role,
        params.assignmentId,
        {
          answerText: body.answerText,
          file: body.file,
        }
      );

      return {
        data: submission,
      };
    },
    {
      params: t.Object({
        assignmentId: t.RegExp(uuidRegex, {
          error: "ID tugas harus berupa UUID valid.",
        }),
      }),
      body: t.Object({
        answerText: t.Optional(t.String()),
        file: t.Optional(t.File()),
      }),
    }
  )
  // GET /assignments/:assignmentId/submissions (teacher only)
  .get(
    "/assignments/:assignmentId/submissions",
    async ({ currentUser, params }) => {
      const submissions =
        await submissionsService.listSubmissionsForAssignment(
          currentUser!.id,
          params.assignmentId
        );

      return {
        data: submissions,
      };
    },
    {
      params: t.Object({
        assignmentId: t.RegExp(uuidRegex, {
          error: "ID tugas harus berupa UUID valid.",
        }),
      }),
    }
  )

  // ── Direct Submission Endpoints ───────────────────────────────────
  // GET /submissions/:submissionId
  .get(
    "/submissions/:submissionId",
    async ({ currentUser, params }) => {
      const { submission, cls } =
        await submissionsService.verifySubmissionAccess(
          currentUser!.id,
          params.submissionId
        );

      return {
        data: {
          ...submission,
          className: cls.name,
        },
      };
    },
    {
      params: t.Object({
        submissionId: t.RegExp(uuidRegex, {
          error: "ID submission harus berupa UUID valid.",
        }),
      }),
    }
  )
  // PATCH /submissions/:submissionId/grade
  .patch(
    "/submissions/:submissionId/grade",
    async ({ currentUser, params, body }) => {
      const graded = await submissionsService.gradeSubmission(
        currentUser!.id,
        params.submissionId,
        {
          grade: Number(body.grade),
          comment: body.comment,
        }
      );

      return {
        data: graded,
      };
    },
    {
      params: t.Object({
        submissionId: t.RegExp(uuidRegex, {
          error: "ID submission harus berupa UUID valid.",
        }),
      }),
      body: t.Object({
        grade: t.Numeric({
          minimum: 0,
          maximum: 100,
          error: "Nilai harus berupa angka antara 0 dan 100.",
        }),
        comment: t.Optional(
          t.String({
            maxLength: 2000,
            error: "Komentar maksimal 2000 karakter.",
          })
        ),
      }),
    }
  )
  // GET /submissions/:submissionId/file (download stream)
  .get(
    "/submissions/:submissionId/file",
    async ({ currentUser, params, set }) => {
      const { file, originalFileName, mimeType } =
        await submissionsService.getSubmissionFileInfo(
          currentUser!.id,
          params.submissionId
        );

      set.headers["Content-Type"] = mimeType;
      set.headers[
        "Content-Disposition"
      ] = `attachment; filename="${encodeURIComponent(originalFileName)}"`;

      return file;
    },
    {
      params: t.Object({
        submissionId: t.RegExp(uuidRegex, {
          error: "ID submission harus berupa UUID valid.",
        }),
      }),
    }
  );

