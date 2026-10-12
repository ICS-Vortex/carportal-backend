import "dotenv/config";

import path from "node:path";

import { z } from "zod";

const booleanStringSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url().default("http://carmain.local"),
  API_ORIGIN: z.string().url().default("http://api.carmain.local"),
  APP_BASE_URL: z.string().url().default("http://carmain.local"),
  JWT_SECRET: z.string().min(16),
  COOKIE_DOMAIN: z.string().optional().default(""),
  COOKIE_SECURE: z.union([z.boolean(), booleanStringSchema]).default(false),
  UPLOADS_DIR: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().email().default("notify@carmain.local"),
  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET: z.string().optional().default(""),
  R2_PUBLIC_BASE_URL: z.string().optional().default(""),
  CMS_UPLOAD_SECRET: z.string().optional().default("")
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  API_ORIGIN: process.env.API_ORIGIN,
  APP_BASE_URL: process.env.APP_BASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  UPLOADS_DIR: process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), "uploads"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  CMS_UPLOAD_SECRET: process.env.CMS_UPLOAD_SECRET
});

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET &&
      env.R2_PUBLIC_BASE_URL
  );
}

export function r2PublicBaseUrl(): string | null {
  const trimmed = env.R2_PUBLIC_BASE_URL.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : null;
}
