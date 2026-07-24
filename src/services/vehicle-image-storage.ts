import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { env } from "../config/env";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export async function saveVehicleImageDataUrl(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);

  if (!match) {
    throw new Error("INVALID_IMAGE_DATA_URL");
  }

  const mimeType = match[1];
  const base64Payload = match[2].replace(/\s+/g, "");
  const extension = ALLOWED_IMAGE_TYPES[mimeType];

  if (!extension) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }

  const buffer = Buffer.from(base64Payload, "base64");

  if (!buffer.length || buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("INVALID_IMAGE_SIZE");
  }

  const directory = path.join(env.UPLOADS_DIR, "vehicles");
  await mkdir(directory, { recursive: true });

  const fileName = `${randomUUID()}${extension}`;
  const filePath = path.join(directory, fileName);
  await writeFile(filePath, buffer);

  return `${env.API_ORIGIN}/uploads/vehicles/${fileName}`;
}