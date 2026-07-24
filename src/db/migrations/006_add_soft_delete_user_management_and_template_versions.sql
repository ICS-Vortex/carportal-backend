alter table users
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_at timestamptz,
  add column if not exists deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_users_is_blocked on users(is_blocked);
create index if not exists idx_users_deleted on users(deleted);

alter table maintenance_procedures
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table maintenance_schedule_templates
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table maintenance_schedule_items
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_maintenance_procedures_deleted on maintenance_procedures(deleted);
create index if not exists idx_maintenance_schedule_templates_deleted on maintenance_schedule_templates(deleted);
create index if not exists idx_maintenance_schedule_items_deleted on maintenance_schedule_items(deleted);

alter table vehicle_maintenance_plans
  add column if not exists source_template_updated_at timestamptz;

with template_versions as (
  select
    mst.id,
    greatest(
      mst.updated_at,
      coalesce(max(msi.updated_at), mst.updated_at),
      coalesce(max(mp.updated_at), mst.updated_at)
    ) as last_changed_at
  from maintenance_schedule_templates mst
  left join maintenance_schedule_items msi on msi.template_id = mst.id and msi.deleted = false
  left join maintenance_procedures mp on mp.id = msi.procedure_id and mp.deleted = false
  where mst.deleted = false
  group by mst.id
)
update vehicle_maintenance_plans plan
set source_template_updated_at = coalesce(plan.source_template_updated_at, template_versions.last_changed_at, plan.assigned_at)
from template_versions
where plan.template_id = template_versions.id
  and plan.source_template_updated_at is null;

update vehicle_maintenance_plans
set source_template_updated_at = coalesce(source_template_updated_at, assigned_at)
where source_template_updated_at is null;

alter table vehicle_maintenance_plans
  alter column source_template_updated_at set not null;