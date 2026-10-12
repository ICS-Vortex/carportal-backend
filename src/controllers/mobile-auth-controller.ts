import type { PoolClient } from "pg";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { env } from "../config/env";
import { pool } from "../db/pool";
import {
  createRefreshSession,
  findRefreshSessionByToken,
  listActiveRefreshSessionsByUser,
  revokeRefreshSession,
  revokeRefreshSessionsByUser,
  revokeRefreshSessionFamily,
  touchRefreshSession
} from "../repositories/auth-session-repository";
import {
  attachGoogleAccount,
  createUser,
  findUserByEmail,
  findUserByGoogleSub
} from "../repositories/user-repository";
import type { UserRecord } from "../types/models";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";
import {
  comparePassword,
  getAccessTokenTtlSeconds,
  isRefreshSessionExpired,
  signAccessToken
} from "../utils/security";

const emailPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120).optional()
});

const googleSchema = z.object({
  idToken: z.string().min(10)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32)
});

let oauthClient: import("google-auth-library").OAuth2Client | null = null;

function toAuthUserPayload(user: {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  avatar_url?: string | null;
}) {
  return {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    avatarUrl: user.avatar_url ?? null
  };
}

async function getGoogleClient(): Promise<import("google-auth-library").OAuth2Client | null> {
  if (!env.GOOGLE_CLIENT_ID) {
    return null;
  }

  if (!oauthClient) {
    const { OAuth2Client } = await import("google-auth-library");
    oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  return oauthClient;
}

function getUserAgent(context: HandlerContext): string | null {
  const rawHeader = context.req.headers["user-agent"];
  if (typeof rawHeader !== "string") {
    return null;
  }

  const userAgent = rawHeader.trim();
  return userAgent.length > 0 ? userAgent.slice(0, 500) : null;
}

async function createMobileAuthResponse(user: UserRecord, context: HandlerContext, client?: PoolClient) {
  const refreshSession = await createRefreshSession({
    userId: user.id,
    userAgent: getUserAgent(context)
  }, client);
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    sessionId: refreshSession.record.id
  });

  return {
    user: toAuthUserPayload(user),
    sessionId: refreshSession.record.id,
    accessToken,
    accessTokenExpiresIn: getAccessTokenTtlSeconds(),
    refreshToken: refreshSession.refreshToken,
    refreshTokenExpiresAt: refreshSession.record.expires_at.toISOString()
  };
}

async function createRotatedMobileAuthResponse(input: {
  user: UserRecord;
  familyId: string;
  sessionIdToRotate: string;
  context: HandlerContext;
  client: PoolClient;
}) {
  const refreshSession = await createRefreshSession({
    userId: input.user.id,
    familyId: input.familyId,
    userAgent: getUserAgent(input.context)
  }, input.client);
  const accessToken = signAccessToken({
    userId: input.user.id,
    email: input.user.email,
    fullName: input.user.full_name,
    role: input.user.role,
    sessionId: refreshSession.record.id
  });

  await touchRefreshSession(input.sessionIdToRotate, input.client);
  await revokeRefreshSession({
    sessionId: input.sessionIdToRotate,
    replacedBySessionId: refreshSession.record.id
  }, input.client);

  return {
    user: toAuthUserPayload(input.user),
    sessionId: refreshSession.record.id,
    accessToken,
    accessTokenExpiresIn: getAccessTokenTtlSeconds(),
    refreshToken: refreshSession.refreshToken,
    refreshTokenExpiresAt: refreshSession.record.expires_at.toISOString()
  };
}

async function findUserByIdWithClient(userId: string, client: PoolClient): Promise<UserRecord | null> {
  const result = await client.query<UserRecord>(
    "select * from users where id = $1 limit 1",
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function mobileRegister(context: HandlerContext): Promise<void> {
  const input = emailPasswordSchema.parse(context.body);
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    sendJson(context.res, 409, {
      code: existingUser.deleted ? "account_deactivated" : "email_already_exists",
      message: existingUser.deleted ? "Акаунт з таким email деактивовано." : "Користувач з таким email вже існує."
    });
    return;
  }

  const { hashPassword } = await import("../utils/security");
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    fullName: sanitizeHtml(input.fullName ?? input.email.split("@")[0], { allowedTags: [], allowedAttributes: {} })
  });

  sendJson(context.res, 201, await createMobileAuthResponse(user, context));
}

export async function mobileLogin(context: HandlerContext): Promise<void> {
  const input = emailPasswordSchema.pick({ email: true, password: true }).parse(context.body);
  const user = await findUserByEmail(input.email);

  if (user?.deleted) {
    sendJson(context.res, 403, { code: "account_deactivated", message: "Акаунт деактивовано." });
    return;
  }

  if (user?.is_blocked) {
    sendJson(context.res, 403, { code: "account_blocked", message: "Акаунт заблоковано." });
    return;
  }

  if (!user?.password_hash || !(await comparePassword(input.password, user.password_hash))) {
    sendJson(context.res, 401, { code: "invalid_credentials", message: "Невірний email або пароль." });
    return;
  }

  sendJson(context.res, 200, await createMobileAuthResponse(user, context));
}

export async function mobileGoogleLogin(context: HandlerContext): Promise<void> {
  const input = googleSchema.parse(context.body);
  const client = await getGoogleClient();

  if (!client) {
    sendJson(context.res, 503, { code: "google_auth_not_configured", message: "Google авторизація ще не налаштована." });
    return;
  }

  const ticket = await client.verifyIdToken({
    idToken: input.idToken,
    audience: env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    sendJson(context.res, 400, { code: "google_profile_unavailable", message: "Не вдалося отримати Google профіль." });
    return;
  }

  let user = await findUserByGoogleSub(payload.sub);

  if (!user) {
    user = (await findUserByEmail(payload.email)) ??
      (await createUser({
        email: payload.email,
        passwordHash: null,
        fullName: sanitizeHtml(payload.name ?? payload.email, { allowedTags: [], allowedAttributes: {} }),
        avatarUrl: payload.picture ?? null
      }));
  }

  if (user.deleted) {
    sendJson(context.res, 403, { code: "account_deactivated", message: "Акаунт деактивовано." });
    return;
  }

  if (user.is_blocked) {
    sendJson(context.res, 403, { code: "account_blocked", message: "Акаунт заблоковано." });
    return;
  }

  await attachGoogleAccount({ userId: user.id, googleSub: payload.sub, email: payload.email });
  sendJson(context.res, 200, await createMobileAuthResponse(user, context));
}

export async function mobileRefresh(context: HandlerContext): Promise<void> {
  const input = refreshSchema.parse(context.body);
  const existingSession = await findRefreshSessionByToken(input.refreshToken);

  if (!existingSession) {
    sendJson(context.res, 401, { code: "invalid_refresh_token", message: "Сесію завершено. Увійдіть знову." });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    const refreshSession = await findRefreshSessionByToken(input.refreshToken, client);

    if (!refreshSession) {
      await client.query("rollback");
      sendJson(context.res, 401, { code: "invalid_refresh_token", message: "Сесію завершено. Увійдіть знову." });
      return;
    }

    if (refreshSession.revoked_at) {
      if (refreshSession.replaced_by_session_id) {
        await revokeRefreshSessionFamily(refreshSession.family_id, client);
      }

      await client.query("commit");
      sendJson(context.res, 401, { code: "refresh_token_reused", message: "Сесію завершено. Увійдіть знову." });
      return;
    }

    if (isRefreshSessionExpired(refreshSession.expires_at)) {
      await revokeRefreshSession({ sessionId: refreshSession.id }, client);
      await client.query("commit");
      sendJson(context.res, 401, { code: "refresh_token_expired", message: "Сесію завершено. Увійдіть знову." });
      return;
    }

    const user = await findUserByIdWithClient(refreshSession.user_id, client);

    if (!user || user.deleted) {
      await revokeRefreshSessionFamily(refreshSession.family_id, client);
      await client.query("commit");
      sendJson(context.res, 401, { code: "session_expired", message: "Сесію завершено. Увійдіть знову." });
      return;
    }

    if (user.is_blocked) {
      await revokeRefreshSessionFamily(refreshSession.family_id, client);
      await client.query("commit");
      sendJson(context.res, 403, { code: "account_blocked", message: "Акаунт заблоковано." });
      return;
    }

    const payload = await createRotatedMobileAuthResponse({
      user,
      familyId: refreshSession.family_id,
      sessionIdToRotate: refreshSession.id,
      context,
      client
    });

    await client.query("commit");
    sendJson(context.res, 200, payload);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function mobileLogout(context: HandlerContext): Promise<void> {
  const input = refreshSchema.parse(context.body);
  const refreshSession = await findRefreshSessionByToken(input.refreshToken);

  if (!refreshSession) {
    sendJson(context.res, 200, { ok: true });
    return;
  }

  await revokeRefreshSessionFamily(refreshSession.family_id);
  sendJson(context.res, 200, { ok: true });
}

export async function mobileSessions(context: HandlerContext): Promise<void> {
  if (!context.user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  const sessions = await listActiveRefreshSessionsByUser({
    userId: context.user.userId,
    currentSessionId: context.user.sessionId ?? null
  });

  sendJson(context.res, 200, {
    items: sessions.map((session) => ({
      id: session.id,
      familyId: session.family_id,
      deviceLabel: session.user_agent ?? "Невідомий пристрій",
      userAgent: session.user_agent,
      expiresAt: session.expires_at.toISOString(),
      lastUsedAt: session.last_used_at?.toISOString() ?? null,
      createdAt: session.created_at.toISOString(),
      isCurrent: session.is_current
    }))
  });
}

export async function mobileLogoutCurrent(context: HandlerContext): Promise<void> {
  if (!context.user?.sessionId) {
    sendJson(context.res, 400, { code: "current_mobile_session_required", message: "Поточну мобільну сесію не знайдено." });
    return;
  }

  await revokeRefreshSession({ sessionId: context.user.sessionId });
  sendJson(context.res, 200, { ok: true });
}

export async function mobileLogoutAll(context: HandlerContext): Promise<void> {
  if (!context.user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  await revokeRefreshSessionsByUser(context.user.userId);
  sendJson(context.res, 200, { ok: true });
}
