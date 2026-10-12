import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env, isR2Configured, r2PublicBaseUrl } from "../config/env";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type ImageFolder = "vehicles" | "avatars" | "service-stations";

let r2Client: S3Client | null | undefined;

function getR2Client(): S3Client {
  if (r2Client === undefined) {
    if (!isR2Configured()) {
      r2Client = null;
    } else {
      r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY
        }
      });
    }
  }

  if (!r2Client) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  return r2Client;
}

function parseImageDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer; extension: string } {
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

  return { mimeType, buffer, extension };
}

async function saveImageToDisk(buffer: Buffer, folder: ImageFolder, extension: string): Promise<string> {
  const directory = path.join(env.UPLOADS_DIR, folder);
  await mkdir(directory, { recursive: true });

  const fileName = `${randomUUID()}${extension}`;
  const filePath = path.join(directory, fileName);
  await writeFile(filePath, buffer);

  return `${env.API_ORIGIN}/uploads/${folder}/${fileName}`;
}

async function saveImageToR2(buffer: Buffer, folder: ImageFolder, extension: string, mimeType: string): Promise<string> {
  const fileName = `${randomUUID()}${extension}`;
  const objectKey = `${folder}/${fileName}`;
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );

  const baseUrl = r2PublicBaseUrl();
  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL_MISSING");
  }

  return `${baseUrl}/${objectKey}`;
}

async function saveImageDataUrl(dataUrl: string, folder: ImageFolder): Promise<string> {
  const { mimeType, buffer, extension } = parseImageDataUrl(dataUrl);

  if (isR2Configured()) {
    return saveImageToR2(buffer, folder, extension, mimeType);
  }

  return saveImageToDisk(buffer, folder, extension);
}

export async function saveVehicleImageDataUrl(dataUrl: string): Promise<string> {
  return saveImageDataUrl(dataUrl, "vehicles");
}

export async function saveAvatarImageDataUrl(dataUrl: string): Promise<string> {
  return saveImageDataUrl(dataUrl, "avatars");
}

export async function saveServiceStationImageDataUrl(dataUrl: string): Promise<string> {
  return saveImageDataUrl(dataUrl, "service-stations");
}

function isManagedImageUrlForFolder(imageUrl: string, folder: ImageFolder): boolean {
  if (imageUrl.includes(`/uploads/${folder}/`)) {
    return true;
  }

  const publicBase = r2PublicBaseUrl();
  return Boolean(publicBase && imageUrl.startsWith(`${publicBase}/${folder}/`));
}

export function isManagedVehicleImageUrl(imageUrl: string): boolean {
  return isManagedImageUrlForFolder(imageUrl, "vehicles");
}

export function isManagedAvatarImageUrl(imageUrl: string): boolean {
  return isManagedImageUrlForFolder(imageUrl, "avatars");
}

export function isManagedServiceStationImageUrl(imageUrl: string): boolean {
  return isManagedImageUrlForFolder(imageUrl, "service-stations");
}

export function isManagedImageUrl(imageUrl: string): boolean {
  return (
    isManagedAvatarImageUrl(imageUrl) ||
    isManagedVehicleImageUrl(imageUrl) ||
    isManagedServiceStationImageUrl(imageUrl)
  );
}

function resolveDiskRelativePath(imageUrl: string): string | null {
  const match = imageUrl.match(/\/uploads\/((?:avatars|vehicles|service-stations)\/[^/?#]+)$/);

  if (!match) {
    return null;
  }

  const relativePath = match[1];

  if (relativePath.includes("..")) {
    return null;
  }

  return relativePath;
}

function resolveR2ObjectKey(imageUrl: string): string | null {
  const publicBase = r2PublicBaseUrl();

  if (!publicBase || !imageUrl.startsWith(`${publicBase}/`)) {
    return null;
  }

  const objectKey = decodeURIComponent(imageUrl.slice(publicBase.length + 1));

  if (
    !objectKey.startsWith("avatars/") &&
    !objectKey.startsWith("vehicles/") &&
    !objectKey.startsWith("service-stations/")
  ) {
    return null;
  }

  if (objectKey.includes("..")) {
    return null;
  }

  return objectKey;
}

export async function deleteManagedImageUrl(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !isManagedImageUrl(imageUrl)) {
    return;
  }

  const objectKey = resolveR2ObjectKey(imageUrl);

  if (objectKey && isR2Configured()) {
    try {
      await getR2Client().send(
        new DeleteObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: objectKey
        })
      );
    } catch (error) {
      console.error(`Failed to delete R2 object ${objectKey}`, error);
    }
  }

  const relativePath = resolveDiskRelativePath(imageUrl);

  if (!relativePath) {
    return;
  }

  const uploadsRoot = path.resolve(env.UPLOADS_DIR);
  const filePath = path.resolve(uploadsRoot, relativePath);

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }

    console.error(`Failed to delete local upload ${relativePath}`, error);
  }
}
