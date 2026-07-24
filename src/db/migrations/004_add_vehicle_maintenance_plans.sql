create table if not exists vehicle_maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null unique references vehicles(id) on delete cascade,
  template_id uuid references maintenance_schedule_templates(id) on delete set null,
  template_name text not null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicle_maintenance_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references vehicle_maintenance_plans(id) on delete cascade,
  procedure_id uuid references maintenance_procedures(id) on delete set null,
  procedure_title text not null,
  procedure_category text not null,
  interval_km integer,
  interval_months integer,
  notes_uk text,
  sort_order integer not null default 0,
  status text not null default 'pending',
  last_completed_at date,
  last_completed_mileage_km integer,
  last_service_log_id uuid references service_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_maintenance_plan_items_status_check check (status in ('pending', 'done', 'skipped'))
);

create index if not exists idx_vehicle_maintenance_plans_vehicle_id on vehicle_maintenance_plans(vehicle_id);
create index if not exists idx_vehicle_maintenance_plan_items_plan_id on vehicle_maintenance_plan_items(plan_id);