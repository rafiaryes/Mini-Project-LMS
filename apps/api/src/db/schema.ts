import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["ADMIN", "TEACHER", "STUDENT"]);
export const classStatusEnum = pgEnum("class_status", ["ACTIVE", "ARCHIVED"]);

// ── 10.1 Users ────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("STUDENT"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── 10.2 Sessions ─────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

// ── 10.3 Classes ──────────────────────────────────────────────────────
export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: classStatusEnum("status").notNull().default("ACTIVE"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── 10.4 Class Memberships ────────────────────────────────────────────
export const classMemberships = pgTable(
  "class_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("class_memberships_class_user_idx").on(
      table.classId,
      table.userId
    ),
  ]
);

// ── 10.5 Assignments ──────────────────────────────────────────────────
export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── 10.6 Submissions ──────────────────────────────────────────────────
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answerText: text("answer_text"),
    fileKey: text("file_key"),
    originalFileName: varchar("original_file_name", { length: 255 }),
    mimeType: varchar("mime_type", { length: 100 }),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    grade: numeric("grade", { precision: 5, scale: 2 }),
    teacherComment: text("teacher_comment"),
    gradedBy: uuid("graded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submissions_assignment_student_idx").on(
      table.assignmentId,
      table.studentId
    ),
    check(
      "submissions_content_check",
      sql`${table.answerText} IS NOT NULL OR ${table.fileKey} IS NOT NULL`
    ),
  ]
);

// ── Relations ─────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  memberships: many(classMemberships),
  createdClasses: many(classes),
  createdAssignments: many(assignments),
  submissions: many(submissions, { relationName: "student_submissions" }),
  gradedSubmissions: many(submissions, { relationName: "graded_by_user" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  creator: one(users, {
    fields: [classes.createdBy],
    references: [users.id],
  }),
  memberships: many(classMemberships),
  assignments: many(assignments),
}));

export const classMembershipsRelations = relations(
  classMemberships,
  ({ one }) => ({
    class: one(classes, {
      fields: [classMemberships.classId],
      references: [classes.id],
    }),
    user: one(users, {
      fields: [classMemberships.userId],
      references: [users.id],
    }),
  })
);

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  class: one(classes, {
    fields: [assignments.classId],
    references: [classes.id],
  }),
  creator: one(users, {
    fields: [assignments.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
    relationName: "student_submissions",
  }),
  grader: one(users, {
    fields: [submissions.gradedBy],
    references: [users.id],
    relationName: "graded_by_user",
  }),
}));

