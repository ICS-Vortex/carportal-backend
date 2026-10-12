import type { IncomingMessage } from "node:http";

import { env } from "../config/env";
import { timingSafeEqual } from "./security";

export function isAuthorizedCmsUpload(req: IncomingMessage): boolean {
  const secret = env.CMS_UPLOAD_SECRET.trim();

  if (!secret) {
    return false;
  }

  const provided = req.headers["x-cms-upload-key"];

  if (typeof provided !== "string" || !provided.trim()) {
    return false;
  }

  return timingSafeEqual(secret, provided.trim());
}
