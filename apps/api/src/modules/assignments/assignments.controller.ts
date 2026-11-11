import { Elysia, t } from "elysia";
import { authPlugin } from "../../middleware/auth.middleware";
import { assignmentsService } from "./assignments.service";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const assignmentsController = new Elysia({ prefix: "/assignments" })
  .use(authPlugin)
  .guard({
    requireAuth: true,
  })
  // GET /assignments/:assignmentId - Detail tugas
  .get(
    "/:assignmentId",
    async ({ currentUser, params }) => {
      const assignment = await assignmentsService.getAssignmentDetail(
        currentUser!.id,
        params.assignmentId
      );

      return {
        data: assignment,
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
  // PATCH /assignments/:assignmentId - Mengubah tugas (guru terkait)
  .patch(
    "/:assignmentId",
    async ({ currentUser, params, body }) => {
      const updated = await assignmentsService.updateAssignment(
        currentUser!.id,
        params.assignmentId,
        {
          title: body.title,
          description: body.description,
          dueAt: body.dueAt,
        }
      );

      return {
        data: updated,
      };
    },
    {
      params: t.Object({
        assignmentId: t.RegExp(uuidRegex, {
          error: "ID tugas harus berupa UUID valid.",
        }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.String()),
        dueAt: t.Optional(t.String()),
      }),
    }
  )
  // POST /assignments/:assignmentId/archive - Mengarsipkan tugas (guru terkait)
  .post(
    "/:assignmentId/archive",
    async ({ currentUser, params }) => {
      const archived = await assignmentsService.archiveAssignment(
        currentUser!.id,
        params.assignmentId
      );

      return {
        data: archived,
      };
    },
    {
      params: t.Object({
        assignmentId: t.RegExp(uuidRegex, {
          error: "ID tugas harus berupa UUID valid.",
        }),
      }),
    }
  );

