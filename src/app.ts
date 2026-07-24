import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { ZodError } from "zod";

import { env } from "./config/env";
import { pool } from "./db/pool";
import { getAuthenticatedUser } from "./middleware/auth";
import { findUserById } from "./repositories/user-repository";
import { routes } from "./routes";
import {
  clearCookie,
  getCookies,
  getRequestUrl,
  isAllowedOrigin,
  matchRoute,
  readJsonBody,
  sendJson,
  setDefaultHeaders
} from "./utils/http";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME, timingSafeEqual } from "./utils/security";

const uploadMimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

async function serveUploadAsset(requestPath: string, res: http.ServerResponse): Promise<boolean> {
  if (!requestPath.startsWith("/uploads/")) {
    return false;
  }

  const uploadsRoot = path.resolve(env.UPLOADS_DIR);
  const relativePath = requestPath.slice("/uploads/".length);
  const filePath = path.resolve(uploadsRoot, relativePath);

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    sendJson(res, 403, { code: "upload_access_forbidden", message: "Доступ заборонено." });
    return true;
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      "Content-Type": uploadMimeTypes[extension] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable"
    });
    res.end(file);
  } catch {
    sendJson(res, 404, { code: "asset_not_found", message: "Файл не знайдено." });
  }

  return true;
}

export async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const origin = req.headers.origin;

  if (!isAllowedOrigin(origin)) {
    sendJson(res, 403, { code: "origin_not_allowed", message: "Заборонене джерело запиту." });
    return;
  }

  setDefaultHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = getRequestUrl(req);

  if (req.method === "GET" && url.pathname === "/v1/health") {
    const result = await pool.query("select now() as now");
    sendJson(res, 200, { ok: true, time: result.rows[0].now });
    return;
  }

  if (req.method === "GET" && await serveUploadAsset(url.pathname, res)) {
    return;
  }

  const route = routes.find((candidate) => {
    if (candidate.method !== req.method) {
      return false;
    }

    return matchRoute(candidate.path, url.pathname).matched;
  });

  if (!route) {
    sendJson(res, 404, { code: "route_not_found", message: "Маршрут не знайдено." });
    return;
  }

  try {
    const { params } = matchRoute(route.path, url.pathname);
    const tokenUser = getAuthenticatedUser(req);
    let user = tokenUser;

    if (route.auth && !user) {
      sendJson(res, 401, { code: "authentication_required", message: "Потрібна авторизація." });
      return;
    }

    if (route.auth && user) {
      const dbUser = await findUserById(user.userId);

      if (!dbUser || dbUser.deleted) {
        clearCookie(res, SESSION_COOKIE_NAME, true);
        clearCookie(res, CSRF_COOKIE_NAME);
        sendJson(res, 401, { code: "session_expired", message: "Сесію завершено. Увійдіть знову." });
        return;
      }

      if (dbUser.is_blocked) {
        clearCookie(res, SESSION_COOKIE_NAME, true);
        clearCookie(res, CSRF_COOKIE_NAME);
        sendJson(res, 403, { code: "account_blocked", message: "Акаунт заблоковано адміністратором." });
        return;
      }

      user = {
        userId: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.full_name,
        role: dbUser.role,
        sessionId: tokenUser?.sessionId ?? null
      };
    }

    if (route.admin && user?.role !== "admin") {
      sendJson(res, 403, { code: "admin_role_required", message: "Потрібні права адміністратора." });
      return;
    }

    if (route.csrf && req.method && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const usesBearerAuth = typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ");

      if (!usesBearerAuth) {
        const cookies = getCookies(req);
        const csrfCookie = cookies[CSRF_COOKIE_NAME];
        const csrfHeader = req.headers["x-csrf-token"];

        if (
          !csrfCookie ||
          typeof csrfHeader !== "string" ||
          !timingSafeEqual(csrfCookie, csrfHeader)
        ) {
          sendJson(res, 403, { code: "invalid_csrf_token", message: "CSRF токен невалідний." });
          return;
        }
      }
    }

    const body = req.method && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
      ? await readJsonBody(req)
      : undefined;

    await route.handler({ req, res, params, body, user });
  } catch (error) {
    if (error instanceof Error && error.message === "SELF_ADMIN_MUTATION") {
      sendJson(res, 409, { code: "self_admin_mutation", message: "Не можна змінити або видалити власний адмін-акаунт через цю дію." });
      return;
    }

    if (error instanceof Error && error.message === "LAST_ADMIN_MUTATION") {
      sendJson(res, 409, { code: "last_admin_mutation", message: "У системі має залишитися принаймні один активний адміністратор." });
      return;
    }

    if (error instanceof SyntaxError) {
      sendJson(res, 400, { code: "invalid_json", message: "Некоректний JSON у тілі запиту." });
      return;
    }

    if (error instanceof ZodError) {
      sendJson(res, 422, { code: "validation_error", message: "Помилка валідації.", issues: error.issues });
      return;
    }

    console.error(error);
    sendJson(res, 500, { code: "internal_server_error", message: "Внутрішня помилка сервера." });
  }
}

export function createAppServer(): http.Server {
  return http.createServer((req, res) => {
    void handleRequest(req, res);
  });
}