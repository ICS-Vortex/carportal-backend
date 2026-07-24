create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  full_name text not null,
  avatar_url text,
  locale text not null default 'uk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_google_accounts (
  user_id uuid primary key references users(id) on delete cascade,
  google_sub text not null unique,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists vehicle_brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicle_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references vehicle_brands(id) on delete cascade,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug),
  unique (brand_id, name)
);

create table if not exists vehicle_generations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references vehicle_models(id) on delete cascade,
  slug text not null,
  name text not null,
  year_from integer not null,
  year_to integer not null,
  notes_uk text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_generations_year_range_check check (year_from <= year_to),
  unique (model_id, slug)
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  generation_id uuid not null references vehicle_generations(id) on delete restrict,
  year integer not null,
  vin text unique,
  license_plate text,
  image_url text,
  mileage_km integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists maintenance_procedures (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title_uk text not null,
  description_uk text,
  default_interval_km integer,
  default_interval_months integer,
  category text not null,
  deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists maintenance_schedule_templates (
  id uuid primary key default gen_random_uuid(),
  name_uk text not null,
  generation_id uuid not null references vehicle_generations(id) on delete restrict,
  notes_uk text,
  deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists maintenance_schedule_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references maintenance_schedule_templates(id) on delete cascade,
  procedure_id uuid not null references maintenance_procedures(id) on delete cascade,
  interval_km integer,
  interval_months integer,
  notes_uk text,
  deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, procedure_id)
);

create table if not exists service_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_date date not null,
  mileage_km integer not null,
  service_station text,
  notes_uk text,
  created_at timestamptz not null default now()
);

create table if not exists service_log_items (
  id uuid primary key default gen_random_uuid(),
  service_log_id uuid not null references service_logs(id) on delete cascade,
  procedure_id uuid not null references maintenance_procedures(id) on delete restrict,
  notes_uk text,
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  procedure_id uuid not null references maintenance_procedures(id) on delete cascade,
  due_date date,
  due_mileage_km integer,
  remind_days_before integer not null default 30,
  notify_in_app boolean not null default true,
  notify_email boolean not null default true,
  status text not null default 'upcoming',
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_models_brand_id on vehicle_models(brand_id);
create index if not exists idx_vehicle_generations_model_id on vehicle_generations(model_id);
create index if not exists idx_vehicles_user_id on vehicles(user_id);
create index if not exists idx_vehicles_generation_id on vehicles(generation_id);
create index if not exists idx_service_logs_vehicle_id on service_logs(vehicle_id);
create index if not exists idx_reminders_user_due_date on reminders(user_id, due_date);
create index if not exists idx_maintenance_procedures_deleted on maintenance_procedures(deleted);
create unique index if not exists idx_maintenance_schedule_templates_unique_generation_active
  on maintenance_schedule_templates(generation_id)
  where deleted = false;
create index if not exists idx_maintenance_schedule_templates_deleted on maintenance_schedule_templates(deleted);
create index if not exists idx_maintenance_schedule_items_deleted on maintenance_schedule_items(deleted);
