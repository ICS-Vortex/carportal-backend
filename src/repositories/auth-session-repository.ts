import type { PoolClient } from "pg";

import { pool } from "../db/pool";
import type { AuthRefreshSessionRecord, MobileSessionView } from "../types/models";
import { generateRefreshToken, getRefreshSessionExpiryDate, hashRefreshToken } from "../utils/security";

type DbClient = PoolClient | typeof pool;

export async function createRefreshSession(input: {
  userId: string;
  familyId?: string;
  userAgent?: string | null;
}, client: DbClient = pool): Promise<{ record: AuthRefreshSessionRecord; refreshToken: string }> {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  const result = await client.query<AuthRefreshSessionRecord>(
    `
      insert into auth_refresh_sessions (user_id, family_id, token_hash, user_agent, expires_at)
      values ($1, coalesce($2, gen_random_uuid()), $3, $4, $5)
      returning *
    `,
    [input.userId, input.familyId ?? null, tokenHash, input.userAgent ?? null, getRefreshSessionExpiryDate()]
  );

  return {
    record: result.rows[0],
    refreshToken
  };
}

export async function findRefreshSessionByToken(refreshToken: string, client: DbClient = pool): Promise<AuthRefreshSessionRecord | null> {
  const result = await client.query<AuthRefreshSessionRecord>(
    "select * from auth_refresh_sessions where token_hash = $1 limit 1",
    [hashRefreshToken(refreshToken)]
  );

  return result.rows[0] ?? null;
}

export async function revokeRefreshSession(input: {
  sessionId: string;
  replacedBySessionId?: string | null;
}, client: DbClient = pool): Promise<void> {
  await client.query(
    `
      update auth_refresh_sessions
      set revoked_at = coalesce(revoked_at, now()),
          replaced_by_session_id = coalesce($2, replaced_by_session_id),
          updated_at = now()
      where id = $1
    `,
    [input.sessionId, input.replacedBySessionId ?? null]
  );
}

export async function revokeRefreshSessionFamily(familyId: string, client: DbClient = pool): Promise<void> {
  await client.query(
    `
      update auth_refresh_sessions
      set revoked_at = coalesce(revoked_at, now()),
          updated_at = now()
      where family_id = $1
        and revoked_at is null
    `,
    [familyId]
  );
}

export async function touchRefreshSession(sessionId: string, client: DbClient = pool): Promise<void> {
  await client.query(
    `
      update auth_refresh_sessions
      set last_used_at = now(),
          updated_at = now()
      where id = $1
    `,
    [sessionId]
  );
}

export async function listActiveRefreshSessionsByUser(input: {
  userId: string;
  currentSessionId?: string | null;
}, client: DbClient = pool): Promise<MobileSessionView[]> {
  const result = await client.query<MobileSessionView>(
    `
      select
        id,
        family_id,
        user_agent,
        expires_at,
        last_used_at,
        created_at,
        coalesce(id = $2::uuid, false) as is_current
      from auth_refresh_sessions
      where user_id = $1
        and revoked_at is null
        and expires_at > now()
      order by (id = $2::uuid) desc, coalesce(last_used_at, created_at) desc, created_at desc
    `,
    [input.userId, input.currentSessionId ?? null]
  );

  return result.rows;
}

export async function revokeRefreshSessionsByUser(userId: string, client: DbClient = pool): Promise<void> {
  await client.query(
    `
      update auth_refresh_sessions
      set revoked_at = coalesce(revoked_at, now()),
          updated_at = now()
      where user_id = $1
        and revoked_at is null
    `,
    [userId]
  );
}
