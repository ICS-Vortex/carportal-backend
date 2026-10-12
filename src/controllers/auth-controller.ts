import type { OAuth2Client } from "google-auth-library";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { env } from "../config/env";
import {
  attachGoogleAccount,
  createUser,
  deleteUserById,
  findUserById,
  findUserByEmail,
  findUserByGoogleSub,
  hasGoogleAccount,
  syncGoogleAccountEmail,
  updateUserPassword,
  updateUserProfile
} from "../repositories/user-repository";
import type { HandlerContext } from "../utils/http";
import { clearCookie, getCookies, sendJson, setCookie } from "../utils/http";
import {
  comparePassword,
  createCsrfToken,
  CSRF_COOKIE_NAME,
  getSessionTtlSeconds,
  hashPassword,
  SESSION_COOKIE_NAME,
  signSessionToken
} from "../utils/security";

const emailPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120).optional()
});

const googleSchema = z.object({
  idToken: z.string().min(10)
});

const profileSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  avatarUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8).optional(),
  newPassword: z.string().min(8)
});

const deleteAccountSchema = z.object({
  confirmationText: z.string().min(1),
  password: z.string().min(8).optional()
});

let oauthClient: OAuth2Client | null = null;

type GoogleIdTokenPayload = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function resolveGoogleFullName(payload: GoogleIdTokenPayload): string {
  const displayName = payload.name?.trim();
  if (displayName && !/\bundefined\b/i.test(displayName)) {
    return displayName;
  }

  const composed = [payload.given_name?.trim(), payload.family_name?.trim()].filter(Boolean).join(" ");
  if (composed.length >= 2) {
    return composed;
  }

  const email = payload.email?.trim();
  if (email) {
    return email.split("@")[0] ?? email;
  }

  return "User";
}

function isWeakDisplayName(fullName: string, email: string): boolean {
  const normalized = fullName.trim();
  if (normalized.length < 2) {
    return true;
  }

  if (/\bundefined\b/i.test(normalized)) {
    return true;
  }

  const localPart = email.split("@")[0]?.toLowerCase();
  return normalized.toLowerCase() === email.toLowerCase() || normalized.toLowerCase() === localPart;
}

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

async function getGoogleClient(): Promise<OAuth2Client | null> {
  if (!env.GOOGLE_CLIENT_ID) {
    return null;
  }

  if (!oauthClient) {
    const { OAuth2Client } = await import("google-auth-library");
    oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  return oauthClient;
}

function issueSession(
  context: HandlerContext,
  user: { id: string; email: string; full_name: string; role: "user" | "admin" }
): void {
  const token = signSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role
  });
  setCookie(context.res, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: getSessionTtlSeconds(),
    sameSite: "lax"
  });
}

export async function getCsrf(context: HandlerContext): Promise<void> {
  const csrfToken = createCsrfToken();
  setCookie(context.res, CSRF_COOKIE_NAME, csrfToken, {
    maxAge: 60 * 60 * 8,
    sameSite: "lax"
  });
  sendJson(context.res, 200, { csrfToken });
}

export async function register(context: HandlerContext): Promise<void> {
  const input = emailPasswordSchema.parse(context.body);
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    sendJson(context.res, 409, {
      code: existingUser.deleted ? "account_deactivated" : "email_already_exists",
      message: existingUser.deleted ? "Акаунт з таким email деактивовано." : "Користувач з таким email вже існує."
    });
    return;
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    fullName: sanitizeHtml(input.fullName ?? input.email.split("@")[0], { allowedTags: [], allowedAttributes: {} })
  });

  issueSession(context, user);
  sendJson(context.res, 201, {
    user: toAuthUserPayload(user)
  });
}

export async function login(context: HandlerContext): Promise<void> {
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

  issueSession(context, user);
  sendJson(context.res, 200, {
    user: toAuthUserPayload(user)
  });
}

export async function googleLogin(context: HandlerContext): Promise<void> {
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
  issueSession(context, user);
  sendJson(context.res, 200, {
    user: toAuthUserPayload(user)
  });
}

export async function logout(context: HandlerContext): Promise<void> {
  clearCookie(context.res, SESSION_COOKIE_NAME, true);
  clearCookie(context.res, CSRF_COOKIE_NAME);
  sendJson(context.res, 200, { ok: true });
}

export async function updateProfile(context: HandlerContext): Promise<void> {
  if (!context.user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  const input = profileSchema.parse(context.body);
  const currentUser = await findUserById(context.user.userId);

  if (!currentUser) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  const normalizedEmail = input.email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser && existingUser.id !== currentUser.id) {
    sendJson(context.res, 409, { code: "email_already_exists", message: "Користувач з таким email вже існує." });
    return;
  }

  const updatedUser = await updateUserProfile({
    userId: currentUser.id,
    email: normalizedEmail,
    fullName: sanitizeHtml(input.fullName, { allowedTags: [], allowedAttributes: {} }),
    avatarUrl: input.avatarUrl ? sanitizeHtml(input.avatarUrl, { allowedTags: [], allowedAttributes: {} }) : null
  });

  await syncGoogleAccountEmail({ userId: updatedUser.id, email: normalizedEmail });
  issueSession(context, updatedUser);

  sendJson(context.res, 200, {
    user: {
      userId: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatar_url,
      hasPassword: Boolean(updatedUser.password_hash),
      hasGoogleAccount: await hasGoogleAccount(updatedUser.id)
    }
  });
}

export async function changePassword(context: HandlerContext): Promise<void> {
  if (!context.user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  const input = passwordSchema.parse(context.body);
  const user = await findUserById(context.user.userId);

  if (!user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  if (user.password_hash) {
    if (!input.currentPassword) {
      sendJson(context.res, 422, { code: "current_password_required", message: "Вкажіть поточний пароль." });
      return;
    }

    if (!(await comparePassword(input.currentPassword, user.password_hash))) {
      sendJson(context.res, 401, { code: "invalid_current_password", message: "Поточний пароль невірний." });
      return;
    }
  }

  if (input.currentPassword && input.currentPassword === input.newPassword) {
    sendJson(context.res, 409, { code: "password_reuse", message: "Новий пароль має відрізнятися від поточного." });
    return;
  }

  const passwordHash = await hashPassword(input.newPassword);
  await updateUserPassword({ userId: user.id, passwordHash });

  sendJson(context.res, 200, { ok: true, message: "Пароль оновлено." });
}

export async function deleteAccount(context: HandlerContext): Promise<void> {
  if (!context.user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  const input = deleteAccountSchema.parse(context.body);
  const user = await findUserById(context.user.userId);

  if (!user) {
    sendJson(context.res, 401, { code: "unauthorized", message: "Неавторизовано." });
    return;
  }

  if (input.confirmationText.trim().toUpperCase() !== "ВИДАЛИТИ") {
    sendJson(context.res, 422, { code: "delete_confirmation_required", message: "Введіть слово ВИДАЛИТИ для підтвердження." });
    return;
  }

  if (user.password_hash) {
    if (!input.password) {
      sendJson(context.res, 422, { code: "current_password_required", message: "Вкажіть поточний пароль для видалення акаунта." });
      return;
    }

    if (!(await comparePassword(input.password, user.password_hash))) {
      sendJson(context.res, 401, { code: "invalid_current_password", message: "Поточний пароль невірний." });
      return;
    }
  }

  await deleteUserById(user.id);
  clearCookie(context.res, SESSION_COOKIE_NAME, true);
  clearCookie(context.res, CSRF_COOKIE_NAME);
  sendJson(context.res, 200, { ok: true, message: "Акаунт деактивовано. Дані збережено, але вхід заблоковано." });
}

function sendAnonymousMe(context: HandlerContext): void {
  const cookies = getCookies(context.req);

  sendJson(context.res, 200, {
    user: null,
    csrfReady: Boolean(cookies[CSRF_COOKIE_NAME])
  });
}

export async function me(context: HandlerContext): Promise<void> {
  if (!context.user) {
    sendAnonymousMe(context);
    return;
  }

  const user = await findUserById(context.user.userId);

  if (!user || user.deleted || user.is_blocked) {
    clearCookie(context.res, SESSION_COOKIE_NAME, true);
    clearCookie(context.res, CSRF_COOKIE_NAME);
    sendAnonymousMe(context);
    return;
  }

  const cookies = getCookies(context.req);
  const googleConnected = await hasGoogleAccount(user.id);

  sendJson(context.res, 200, {
    user: {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      hasPassword: Boolean(user.password_hash),
      hasGoogleAccount: googleConnected
    },
    csrfReady: Boolean(cookies[CSRF_COOKIE_NAME])
  });
}
