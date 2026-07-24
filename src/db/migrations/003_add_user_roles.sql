alter table users
add column if not exists role text not null default 'user';

update users
set role = 'admin'
where id = (
  select id
  from users
  order by created_at asc
  limit 1
)
and not exists(select 1 from users where role = 'admin');

create index if not exists idx_users_role on users(role);
