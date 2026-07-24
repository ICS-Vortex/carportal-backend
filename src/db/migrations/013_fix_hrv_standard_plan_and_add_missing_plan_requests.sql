create table if not exists maintenance_plan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved')),
  request_note text,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_maintenance_plan_requests_vehicle_user_open
  on maintenance_plan_requests(vehicle_id, user_id)
  where status = 'open';

create index if not exists idx_maintenance_plan_requests_status_created_at
  on maintenance_plan_requests(status, created_at desc);

with base as (
  select
    source_template.id as source_template_id,
    source_template.name_uk,
    source_template.notes_uk,
    standard_config.id as target_configuration_id,
    standard_config.generation_id
  from maintenance_schedule_templates source_template
  inner join vehicle_configurations source_config on source_config.id = source_template.configuration_id
  inner join vehicle_generations vg on vg.id = source_template.generation_id
  inner join vehicle_models vm on vm.id = vg.model_id
  inner join vehicle_brands vb on vb.id = vm.brand_id
  inner join vehicle_configurations standard_config on standard_config.generation_id = vg.id and standard_config.slug = 'standard'
  where vb.slug = 'honda'
    and vm.slug = 'hr-v'
    and vg.slug = 'ru1'
    and source_config.slug = '18-cvt-fwd'
    and source_template.deleted = false
), inserted_templates as (
  insert into maintenance_schedule_templates (name_uk, generation_id, configuration_id, notes_uk)
  select
    concat(base.name_uk, ' стандартна конфігурація'),
    base.generation_id,
    base.target_configuration_id,
    concat_ws(' ', base.notes_uk, 'Універсальний варіант для вже створених авто, де конфігурацію двигуна і приводу ще не уточнено.')
  from base
  where not exists (
    select 1
    from maintenance_schedule_templates existing
    where existing.configuration_id = base.target_configuration_id
      and existing.deleted = false
  )
  returning id, configuration_id
), target_templates as (
  select inserted_templates.id as template_id, base.source_template_id
  from inserted_templates
  inner join base on base.target_configuration_id = inserted_templates.configuration_id
  union all
  select existing.id as template_id, base.source_template_id
  from base
  inner join maintenance_schedule_templates existing on existing.configuration_id = base.target_configuration_id and existing.deleted = false
), source_items as (
  select
    target_templates.template_id,
    msi.procedure_id,
    msi.interval_km,
    msi.interval_months,
    case
      when mp.code = 'rear-differential-fluid' then 'Додавайте цю операцію лише для повнопривідних авто після уточнення конфігурації.'
      else msi.notes_uk
    end as notes_uk
  from target_templates
  inner join maintenance_schedule_items msi on msi.template_id = target_templates.source_template_id and msi.deleted = false
  inner join maintenance_procedures mp on mp.id = msi.procedure_id and mp.deleted = false
)
insert into maintenance_schedule_items (template_id, procedure_id, interval_km, interval_months, notes_uk)
select template_id, procedure_id, interval_km, interval_months, notes_uk
from source_items
on conflict (template_id, procedure_id) do update set
  interval_km = excluded.interval_km,
  interval_months = excluded.interval_months,
  notes_uk = excluded.notes_uk,
  deleted = false,
  deleted_at = null,
  updated_at = now();