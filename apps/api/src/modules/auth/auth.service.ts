import { eq } from "drizzle-orm";
import { db, schema } from "../../db/connection";
import { UnauthorizedError } from "../../utils/errors";
import {
  generateSessionToken,
  hashToken,
  SESSION_TTL_MS,
} from "./auth.utils";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

export interface LoginResult {
  user: SafeUser;
  rawToken: string;
  expiresAt: Date;
}

export interface SessionValidationResult {
  user: SafeUser;
  sessionId: string;
}

export class AuthService {
  /**
   * Authenticate user with email and password, then create a new session.
   */
  async login(emailInput: string, passwordInput: string): Promise<LoginResult> {
    if (!db) {
      throw new Error("Koneksi database tidak tersedia.");
    }

    const email = emailInput.trim().toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      throw new UnauthorizedError("Email atau kata sandi tidak valid.");
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        "Akun Anda telah dinonaktifkan. Hubungi administrator."
      );
    }

    const isPasswordValid = await Bun.password.verify(
      passwordInput,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Email atau kata sandi tidak valid.");
    }

    // Generate high-entropy token and its SHA-256 hash
    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await db.insert(schema.sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      rawToken,
      expiresAt,
    };
  }

  /**
   * Invalidate and delete a session by its raw token.
   */
  async logout(rawToken: string): Promise<boolean> {
    if (!db || !rawToken) return false;

    const tokenHash = hashToken(rawToken);
    await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
    return true;
  }

  /**
   * Validate session token from cookie or Authorization header.
   */
  async validateSession(
    rawToken?: string
  ): Promise<SessionValidationResult | null> {
    if (!db || !rawToken) return null;

    try {
      const tokenHash = hashToken(rawToken);

      const session = await db.query.sessions.findFirst({
        where: eq(schema.sessions.tokenHash, tokenHash),
      });

      if (!session) return null;

      // Check expiry
      if (session.expiresAt <= new Date()) {
        await db
          .delete(schema.sessions)
          .where(eq(schema.sessions.id, session.id));
        return null;
      }

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, session.userId),
      });

      if (!user || !user.isActive) {
        await db
          .delete(schema.sessions)
          .where(eq(schema.sessions.id, session.id));
        return null;
      }

      // Touch last seen (fire & forget)
      db.update(schema.sessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(schema.sessions.id, session.id))
        .catch(() => {});

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        sessionId: session.id,
      };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();

