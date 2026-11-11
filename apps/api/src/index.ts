import "./env";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { testConnection } from "./db/connection";
import { adminController } from "./modules/admin/admin.controller";
import { assignmentsController } from "./modules/assignments/assignments.controller";
import { authController } from "./modules/auth/auth.controller";
import { classesController } from "./modules/classes/classes.controller";
import { submissionsController } from "./modules/submissions/submissions.controller";
import { errorPlugin } from "./plugins/error.plugin";

const API_PORT = Number(process.env.API_PORT) || 3001;
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000";

export const app = new Elysia()
  // Global Error Handler
  .use(errorPlugin)
  // CORS configuration
  .use(
    cors({
      origin: WEB_ORIGIN,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  )
  // Health check endpoint
  .get("/api/health", async () => {
    const dbConnected = await testConnection();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        database: dbConnected,
      },
    };
  })
  // API v1 prefix
  .group("/api/v1", (v1) =>
    v1
      .use(authController)
      .use(adminController)
      .use(classesController)
      .use(assignmentsController)
      .use(submissionsController)
  );

if (import.meta.main) {
  app.listen(API_PORT);
  console.log(
    `🚀 LMS API is running at http://${app.server?.hostname}:${app.server?.port}`
  );
}

export default app;
export type App = typeof app;
