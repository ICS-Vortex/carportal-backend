import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

import { parse as parseCookie, serialize } from "cookie";

import { env } from "../config/env";
import type { ApiErrorPayload, ApiErrorResponse, ApiSuccessResponse } from "../types/api";
import type { AuthenticatedUser } from "../types/models";

export type HandlerContext = {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  body: unknown;
  user: AuthenticatedUser | null;
};

export type RouteDefinition = {
  method: string;
  path: string;
  handler: (context: HandlerContext) => Promise<void>;
  auth?: boolean;
  csrf?: boolean;
  cmsUpload?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function inferErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation_error";
    case 500:
      return "internal_server_error";
    case 503:
      return "service_unavailable";
    default:
      return `http_${statusCode}`;
  }
}

function isApiSuccessResponse(payload: unknown): payload is ApiSuccessResponse<unknown> {
  return isRecord(payload) && "data" in payload;
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    isRecord(payload) &&
    "error" in payload &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string" &&
    typeof payload.error.code === "string"
  );
}

function normalizeErrorPayload(statusCode: number, payload: unknown): ApiErrorResponse {
  if (isApiErrorResponse(payload)) {
    return payload;
  }

  const errorPayload = isRecord(payload) ? (payload as ApiErrorPayload) : undefined;
  const details = errorPayload?.details ?? errorPayload?.issues;

  return {
    error: {
      code: typeof errorPayload?.code === "string" ? errorPayload.code : inferErrorCode(statusCode),
      message: typeof errorPayload?.message === "string" ? errorPayload.message : "Сталася помилка під час обробки запиту.",
      ...(details === undefined ? {} : { details })
    }
  };
}

function normalizeSuccessPayload(payload: unknown): ApiSuccessResponse<unknown> {
  if (isApiSuccessResponse(payload)) {
    return payload;
  }

  return { data: payload };
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return undefined;
  }

  return JSON.parse(rawBody);
}

export function getRequestUrl(req: IncomingMessage): URL {
  const origin = env.API_ORIGIN;
  return new URL(req.url ?? "/", origin);
}

export function setDefaultHeaders(res: ServerResponse, origin?: string): void {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Origin", origin ?? env.FRONTEND_ORIGIN);
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()" );
}

export function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
  headers?: Record<string, string>
): void {
  const normalizedPayload = statusCode >= 400
    ? normalizeErrorPayload(statusCode, payload)
    : normalizeSuccessPayload(payload);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  res.end(JSON.stringify(normalizedPayload));
}

export function sendNoContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

export function getCookies(req: IncomingMessage): Record<string, string> {
  const cookies = parseCookie(req.headers.cookie ?? "");

  return Object.fromEntries(
    Object.entries(cookies).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

export function setCookie(
  res: ServerResponse,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    maxAge?: number;
    sameSite?: "lax" | "strict" | "none";
  } = {}
): void {
  const cookie = serialize(name, value, {
    path: "/",
    httpOnly: options.httpOnly ?? false,
    maxAge: options.maxAge,
    sameSite: options.sameSite ?? "lax",
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined
  });

  const existing = res.getHeader("Set-Cookie");
  const nextValue = Array.isArray(existing) ? [...existing, cookie] : existing ? [String(existing), cookie] : [cookie];
  res.setHeader("Set-Cookie", nextValue);
}

export function clearCookie(res: ServerResponse, name: string, httpOnly = false): void {
  setCookie(res, name, "", { httpOnly, maxAge: 0, sameSite: "lax" });
}

const hostAliases: Record<string, string> = {
  "carmain.local": "carmain.localhost.com",
  "carmain.localhost.com": "carmain.local",
  "api.carmain.local": "api.carmain.localhost.com",
  "api.carmain.localhost.com": "api.carmain.local"
};

function withHostAlias(origin: string): string[] {
  try {
    const url = new URL(origin);
    const alias = hostAliases[url.hostname];

    if (!alias) {
      return [url.origin];
    }

    url.hostname = alias;
    return [origin, url.origin];
  } catch {
    return [origin];
  }
}

function allowedOrigins(): Set<string> {
  return new Set(
    [env.FRONTEND_ORIGIN, env.API_ORIGIN, env.APP_BASE_URL].flatMap(withHostAlias)
  );
}

export function isAllowedOrigin(originHeader: string | undefined): boolean {
  if (!originHeader) {
    return true;
  }

  return allowedOrigins().has(originHeader);
}

export function matchRoute(
  routePath: string,
  actualPath: string
): { matched: boolean; params: Record<string, string> } {
  const routeSegments = routePath.split("/").filter(Boolean);
  const pathSegments = actualPath.split("/").filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const pathSegment = pathSegments[index];

    if (routeSegment.startsWith(":")) {
      params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (routeSegment !== pathSegment) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}
