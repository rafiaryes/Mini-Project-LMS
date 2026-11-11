import { Elysia, t } from "elysia";
import { authPlugin } from "../../middleware/auth.middleware";
import { assignmentsService } from "../assignments/assignments.service";
import { classesService } from "./classes.service";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const classesController = new Elysia({ prefix: "/classes" })
  .use(authPlugin)
  .guard({
    requireAuth: true,
  })
  // ── 11.4 Classes ──────────────────────────────────────────────────
  // GET /classes - List classes the current user is member of
  .get(
    "/",
    async ({ currentUser, query }) => {
      const result = await classesService.getUserClasses(currentUser!.id, {
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });

      return {
        data: result.items,
        pagination: result.pagination,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      }),
    }
  )
  // GET /classes/:classId - Class detail (authorized members only)
  .get(
    "/:classId",
    async ({ currentUser, params }) => {
      const classDetail = await classesService.getClassDetail(
        currentUser!.id,
        params.classId
      );

      return {
        data: classDetail,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, {
          error: "ID kelas harus berupa UUID valid.",
        }),
      }),
    }
  )
  // GET /classes/:classId/members - Members for assigned teacher
  .get(
    "/:classId/members",
    async ({ currentUser, params }) => {
      const members = await classesService.getClassMembers(
        currentUser!.id,
        currentUser!.role,
        params.classId
      );

      return {
        data: members,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, {
          error: "ID kelas harus berupa UUID valid.",
        }),
      }),
    }
  )

  // ── 11.5 Assignments per class ────────────────────────────────────
  // GET /classes/:classId/assignments - Assignments list for class members
  .get(
    "/:classId/assignments",
    async ({ currentUser, params }) => {
      const assignments = await assignmentsService.listClassAssignments(
        currentUser!.id,
        currentUser!.role,
        params.classId
      );

      return {
        data: assignments,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, {
          error: "ID kelas harus berupa UUID valid.",
        }),
      }),
    }
  )
  // POST /classes/:classId/assignments - Create assignment (assigned teacher)
  .post(
    "/:classId/assignments",
    async ({ currentUser, params, body, set }) => {
      const newAssignment = await assignmentsService.createAssignment(
        currentUser!.id,
        currentUser!.role,
        params.classId,
        {
          title: body.title,
          description: body.description,
          dueAt: body.dueAt,
        }
      );

      set.status = 201;
      return {
        data: newAssignment,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, {
          error: "ID kelas harus berupa UUID valid.",
        }),
      }),
      body: t.Object({
        title: t.String({
          minLength: 1,
          maxLength: 255,
          error: "Judul tugas wajib diisi.",
        }),
        description: t.Optional(t.String()),
        dueAt: t.String({
          error: "Batas waktu (dueAt) wajib diisi dengan format tanggal ISO.",
        }),
      }),
    }
  );

