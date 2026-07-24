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
    "select * from users where email = $1 limit 1",
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
      insert into users (email, password_hash, full_name, avatar_url, role)
      values (
        $1,
        $2,
        $3,
        $4,
        case when exists(select 1 from users where deleted = false) then 'user' else 'admin' end
      )
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
      insert into user_google_accounts (user_id, google_sub, email)
      values ($1, $2, $3)
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

export async function listAdminUsers(): Promise<Array<{
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  avatar_url: string | null;
  is_blocked: boolean;
  blocked_at: Date | null;
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  vehicles_count: string;
}>> {
  const result = await pool.query(
    `
      select
        users.id,
        users.email,
        users.full_name,
        users.role,
        users.avatar_url,
        users.is_blocked,
        users.blocked_at,
        users.deleted,
        users.deleted_at,
        users.created_at,
        users.updated_at,
        count(vehicles.id)::text as vehicles_count
      from users
      left join vehicles on vehicles.user_id = users.id
      group by users.id
      order by users.deleted asc, users.is_blocked asc, users.created_at desc
    `
  );

  return result.rows;
}

async function countActiveAdmins(excludedUserId?: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from users
      where role = 'admin'
        and deleted = false
        and ($1::uuid is null or id <> $1)
    `,
    [excludedUserId ?? null]
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function updateAdminUserState(input: {
  userId: string;
  role?: "user" | "admin";
  isBlocked?: boolean;
  deleted?: boolean;
  actingUserId: string;
}): Promise<UserRecord | null> {
  const currentUser = await findUserById(input.userId);

  if (!currentUser) {
    return null;
  }

  const nextRole = input.role ?? currentUser.role;
  const nextDeleted = input.deleted ?? currentUser.deleted;
  const nextBlocked = (input.isBlocked ?? currentUser.is_blocked) || nextDeleted;

  if (currentUser.id === input.actingUserId) {
    const selfMutation = nextDeleted || nextBlocked || nextRole !== currentUser.role;

    if (selfMutation) {
      throw new Error("SELF_ADMIN_MUTATION");
    }
  }

  if (currentUser.role === "admin" && (nextRole !== "admin" || nextDeleted || nextBlocked)) {
    const adminsLeft = await countActiveAdmins(currentUser.id);

    if (adminsLeft === 0) {
      throw new Error("LAST_ADMIN_MUTATION");
    }
  }

  const result = await pool.query<UserRecord>(
    `
      update users
      set role = $2,
          is_blocked = $3,
          blocked_at = case
            when $3 = true and blocked_at is null then now()
            when $3 = false then null
            else blocked_at
          end,
          deleted = $4,
          deleted_at = case
            when $4 = true and deleted_at is null then now()
            when $4 = false then null
            else deleted_at
          end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [input.userId, nextRole, nextBlocked, nextDeleted]
  );

  return result.rows[0] ?? null;
}
