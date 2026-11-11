import { Elysia, t } from "elysia";
import { authPlugin } from "../../middleware/auth.middleware";
import { adminClassesService } from "./admin-classes.service";
import { adminUsersService } from "./admin-users.service";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const adminController = new Elysia({ prefix: "/admin" })
  .use(authPlugin)
  // Guard all admin routes with requireRoles: ["ADMIN"]
  .guard({
    requireRoles: ["ADMIN"],
  })
  // ── 11.2 Admin Users ──────────────────────────────────────────────
  // GET /admin/users
  .get(
    "/users",
    async ({ query }) => {
      const result = await adminUsersService.listUsers({
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        role: query.role,
        search: query.search,
        isActive:
          query.isActive !== undefined
            ? query.isActive === "true" || query.isActive === true
            : undefined,
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
        role: t.Optional(
          t.Union([
            t.Literal("ADMIN"),
            t.Literal("TEACHER"),
            t.Literal("STUDENT"),
          ])
        ),
        search: t.Optional(t.String()),
        isActive: t.Optional(t.Union([t.Boolean(), t.String()])),
      }),
    }
  )
  // POST /admin/users
  .post(
    "/users",
    async ({ body, set }) => {
      const user = await adminUsersService.createUser({
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
      });

      set.status = 201;
      return {
        data: user,
      };
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          maxLength: 255,
          error: "Nama pengguna wajib diisi (maks 255 karakter).",
        }),
        email: t.String({
          format: "email",
          error: "Format email tidak valid.",
        }),
        password: t.String({
          minLength: 6,
          error: "Kata sandi minimal 6 karakter.",
        }),
        role: t.Union(
          [
            t.Literal("ADMIN"),
            t.Literal("TEACHER"),
            t.Literal("STUDENT"),
          ],
          { error: "Role harus ADMIN, TEACHER, atau STUDENT." }
        ),
      }),
    }
  )
  // GET /admin/users/:userId
  .get(
    "/users/:userId",
    async ({ params }) => {
      const user = await adminUsersService.getUserById(params.userId);
      return {
        data: user,
      };
    },
    {
      params: t.Object({
        userId: t.RegExp(uuidRegex, { error: "ID pengguna harus berupa UUID valid." }),
      }),
    }
  )
  // PATCH /admin/users/:userId
  .patch(
    "/users/:userId",
    async ({ params, body }) => {
      const user = await adminUsersService.updateUser(params.userId, {
        name: body.name,
        role: body.role,
        isActive: body.isActive,
      });

      return {
        data: user,
      };
    },
    {
      params: t.Object({
        userId: t.RegExp(uuidRegex, { error: "ID pengguna harus berupa UUID valid." }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        role: t.Optional(
          t.Union([
            t.Literal("ADMIN"),
            t.Literal("TEACHER"),
            t.Literal("STUDENT"),
          ])
        ),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  // POST /admin/users/:userId/deactivate
  .post(
    "/users/:userId/deactivate",
    async ({ params }) => {
      const user = await adminUsersService.deactivateUser(params.userId);
      return {
        data: user,
      };
    },
    {
      params: t.Object({
        userId: t.RegExp(uuidRegex, { error: "ID pengguna harus berupa UUID valid." }),
      }),
    }
  )

  // ── 11.3 Admin Classes ────────────────────────────────────────────
  // GET /admin/classes
  .get(
    "/classes",
    async ({ query }) => {
      const result = await adminClassesService.listClasses({
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        status: query.status,
        search: query.search,
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
        status: t.Optional(
          t.Union([t.Literal("ACTIVE"), t.Literal("ARCHIVED")])
        ),
        search: t.Optional(t.String()),
      }),
    }
  )
  // POST /admin/classes
  .post(
    "/classes",
    async ({ currentUser, body, set }) => {
      const newClass = await adminClassesService.createClass(
        currentUser!.id,
        {
          name: body.name,
          description: body.description,
        }
      );

      set.status = 201;
      return {
        data: newClass,
      };
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          maxLength: 255,
          error: "Nama kelas wajib diisi.",
        }),
        description: t.Optional(t.String()),
      }),
    }
  )
  // GET /admin/classes/:classId
  .get(
    "/classes/:classId",
    async ({ params }) => {
      const classDetail = await adminClassesService.getClassById(
        params.classId
      );
      return {
        data: classDetail,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, { error: "ID kelas harus berupa UUID valid." }),
      }),
    }
  )
  // PATCH /admin/classes/:classId
  .patch(
    "/classes/:classId",
    async ({ params, body }) => {
      const updatedClass = await adminClassesService.updateClass(
        params.classId,
        {
          name: body.name,
          description: body.description,
          status: body.status,
        }
      );

      return {
        data: updatedClass,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, { error: "ID kelas harus berupa UUID valid." }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.String()),
        status: t.Optional(
          t.Union([t.Literal("ACTIVE"), t.Literal("ARCHIVED")])
        ),
      }),
    }
  )
  // PUT /admin/classes/:classId/teachers
  .put(
    "/classes/:classId/teachers",
    async ({ params, body }) => {
      const teachers = await adminClassesService.setTeachers(
        params.classId,
        body.teacherIds
      );

      return {
        data: teachers,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, { error: "ID kelas harus berupa UUID valid." }),
      }),
      body: t.Object({
        teacherIds: t.Array(
          t.RegExp(uuidRegex, {
            error: "Format ID guru harus berupa UUID valid.",
          })
        ),
      }),
    }
  )
  // PUT /admin/classes/:classId/students
  .put(
    "/classes/:classId/students",
    async ({ params, body }) => {
      const students = await adminClassesService.setStudents(
        params.classId,
        body.studentIds
      );

      return {
        data: students,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, { error: "ID kelas harus berupa UUID valid." }),
      }),
      body: t.Object({
        studentIds: t.Array(
          t.RegExp(uuidRegex, {
            error: "Format ID murid harus berupa UUID valid.",
          })
        ),
      }),
    }
  )
  // GET /admin/classes/:classId/members
  .get(
    "/classes/:classId/members",
    async ({ params }) => {
      const members = await adminClassesService.getClassMembers(
        params.classId
      );

      return {
        data: members,
      };
    },
    {
      params: t.Object({
        classId: t.RegExp(uuidRegex, { error: "ID kelas harus berupa UUID valid." }),
      }),
    }
  );

