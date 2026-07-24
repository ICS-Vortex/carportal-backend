create table if not exists auth_refresh_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  family_id uuid not null,
  token_hash text not null unique,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by_session_id uuid references auth_refresh_sessions(id) on delete set null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_auth_refresh_sessions_user_id on auth_refresh_sessions(user_id);
create index if not exists idx_auth_refresh_sessions_family_id on auth_refresh_sessions(family_id);
create index if not exists idx_auth_refresh_sessions_expires_at on auth_refresh_sessions(expires_at);
