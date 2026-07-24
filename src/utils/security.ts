import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import type { AuthenticatedUser } from "../types/models";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_DAYS = 45;

export const SESSION_COOKIE_NAME = "cp_session";
export const CSRF_COOKIE_NAME = "cp_csrf";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: AuthenticatedUser): string {
  return jwt.sign({ ...user, tokenType: "session" }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: SESSION_TTL_SECONDS });
}

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign({ ...user, tokenType: "access" }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Partial<AuthenticatedUser> & {
      userId?: string;
      email?: string;
      tokenType?: string;
    };

    if (!payload.userId || !payload.email || payload.tokenType !== "session") {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      fullName: payload.fullName ?? payload.email,
      role: payload.role ?? "user"
    };
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Partial<AuthenticatedUser> & {
      userId?: string;
      email?: string;
      tokenType?: string;
      sessionId?: string;
    };

    if (!payload.userId || !payload.email || payload.tokenType !== "access") {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      fullName: payload.fullName ?? payload.email,
      role: payload.role ?? "user",
      sessionId: payload.sessionId ?? null
    };
  } catch {
    return null;
  }
}

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshSessionExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isRefreshSessionExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

export function timingSafeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

export function getAccessTokenTtlSeconds(): number {
  return ACCESS_TOKEN_TTL_SECONDS;
}
