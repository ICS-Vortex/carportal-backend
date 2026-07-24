import type { IncomingMessage } from "node:http";

import { getCookies } from "../utils/http";
import { SESSION_COOKIE_NAME, verifyAccessToken, verifySessionToken } from "../utils/security";
import type { AuthenticatedUser } from "../types/models";

export function getAuthenticatedUser(req: IncomingMessage): AuthenticatedUser | null {
  const authorization = req.headers.authorization;

  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    return token ? verifyAccessToken(token) : null;
  }

  const cookies = getCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
