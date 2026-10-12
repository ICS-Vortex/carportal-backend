import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { ServerResponse } from "node:http";
import type http from "node:http";

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@127.0.0.1:5432/test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-key-1234567890";
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://carmain.local";
process.env.API_ORIGIN = process.env.API_ORIGIN ?? "http://api.carmain.local";
process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "http://carmain.local";
process.env.UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/tmp/car-portal-test-uploads";

let server: http.Server;
let baseUrl = "";
let sendJson: typeof import("./utils/http").sendJson;

before(async () => {
  const appModule = await import("./app");
  const httpModule = await import("./utils/http");

  sendJson = httpModule.sendJson;
  server = appModule.createAppServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("GET /v1/public/landing returns a success envelope", async () => {
  const response = await fetch(`${baseUrl}/v1/public/landing`);
  const payload = await response.json() as { data?: { slides?: unknown[]; generatedAt?: string } };

  assert.equal(response.status, 200);
  assert.ok(payload.data);
  assert.ok(Array.isArray(payload.data?.slides));
  assert.equal(typeof payload.data?.generatedAt, "string");
});

test("former admin routes are not part of the user API", async () => {
  const response = await fetch(`${baseUrl}/v1/admin/overview`);
  const payload = await response.json() as { error?: { code?: string } };

  assert.equal(response.status, 404);
  assert.equal(payload.error?.code, "route_not_found");
});

test("GET unknown route returns structured error envelope", async () => {
  const response = await fetch(`${baseUrl}/v1/does-not-exist`);
  const payload = await response.json() as { error?: { code?: string; message?: string } };

  assert.equal(response.status, 404);
  assert.deepEqual(payload, {
    error: {
      code: "route_not_found",
      message: "Маршрут не знайдено."
    }
  });
});

test("GET /v1/auth/me without session returns anonymous session payload", async () => {
  const response = await fetch(`${baseUrl}/v1/auth/me`);
  const payload = await response.json() as { data?: { user?: unknown; csrfReady?: boolean } };

  assert.equal(response.status, 200);
  assert.equal(payload.data?.user, null);
  assert.equal(payload.data?.csrfReady, false);
});

test("POST /v1/auth/login without CSRF returns structured csrf error", async () => {
  const response = await fetch(`${baseUrl}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: "test@example.com", password: "password123" })
  });
  const payload = await response.json() as { error?: { code?: string; message?: string } };

  assert.equal(response.status, 403);
  assert.equal(payload.error?.code, "invalid_csrf_token");
  assert.equal(payload.error?.message, "CSRF токен невалідний.");
});

test("sendJson normalizes validation payloads into error.details", () => {
  let statusCode = 0;
  let rawPayload = "";

  const response = {
    writeHead(nextStatusCode: number) {
      statusCode = nextStatusCode;
      return response;
    },
    end(chunk?: string) {
      rawPayload = chunk ?? "";
      return response;
    }
  } as unknown as ServerResponse;

  sendJson(response, 422, {
    message: "Помилка валідації.",
    issues: [{ path: ["email"], message: "Invalid email" }]
  });

  const payload = JSON.parse(rawPayload) as {
    error?: { code?: string; message?: string; details?: Array<{ path: string[]; message: string }> };
  };

  assert.equal(statusCode, 422);
  assert.equal(payload.error?.code, "validation_error");
  assert.equal(payload.error?.message, "Помилка валідації.");
  assert.deepEqual(payload.error?.details, [{ path: ["email"], message: "Invalid email" }]);
});