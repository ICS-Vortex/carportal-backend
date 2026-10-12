import { pool } from "../db/pool";
import type { UserRecord } from "../types/models";

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "select * from users where id = $1 limit 1",
    [id]
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "select * from users where lower(email) = lower($1) limit 1",
    [email.toLowerCase()]
  );
  return result.rows[0] ?? null;
}

export async function findUserByGoogleSub(googleSub: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `
      select users.*
      from users
      inner join user_google_accounts on user_google_accounts.user_id = users.id
      where user_google_accounts.google_sub = $1
      limit 1
    `,
    [googleSub]
  );
  return result.rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string | null;
  fullName: string;
  avatarUrl?: string | null;
}): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `
      insert into users (id, email, password_hash, full_name, avatar_url, role, created_at, updated_at)
      values (gen_random_uuid(), $1, $2, $3, $4, 'user', now(), now())
      returning *
    `,
    [input.email.toLowerCase(), input.passwordHash, input.fullName, input.avatarUrl ?? null]
  );

  return result.rows[0];
}

export async function attachGoogleAccount(input: {
  userId: string;
  googleSub: string;
  email: string;
}): Promise<void> {
  await pool.query(
    `
      insert into user_google_accounts (user_id, google_sub, email, created_at)
      values ($1, $2, $3, now())
      on conflict (google_sub) do update set email = excluded.email
    `,
    [input.userId, input.googleSub, input.email.toLowerCase()]
  );
}

export async function hasGoogleAccount(userId: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    "select exists(select 1 from user_google_accounts where user_id = $1) as exists",
    [userId]
  );

  return result.rows[0]?.exists ?? false;
}

export async function updateUserProfile(input: {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
}): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `
      update users
      set email = $2,
          full_name = $3,
          avatar_url = $4,
          updated_at = now()
      where id = $1
      returning *
    `,
    [input.userId, input.email.toLowerCase(), input.fullName, input.avatarUrl ?? null]
  );

  return result.rows[0];
}

export async function syncGoogleAccountEmail(input: { userId: string; email: string }): Promise<void> {
  await pool.query(
    `
      update user_google_accounts
      set email = $2
      where user_id = $1
    `,
    [input.userId, input.email.toLowerCase()]
  );
}

export async function updateUserPassword(input: { userId: string; passwordHash: string }): Promise<void> {
  await pool.query(
    `
      update users
      set password_hash = $2,
          updated_at = now()
      where id = $1
    `,
    [input.userId, input.passwordHash]
  );
}

export async function deleteUserById(userId: string): Promise<void> {
  await pool.query(
    `
      update users
      set deleted = true,
          deleted_at = now(),
          is_blocked = true,
          blocked_at = coalesce(blocked_at, now()),
          updated_at = now()
      where id = $1
    `,
    [userId]
  );
}

