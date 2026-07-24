create table if not exists vehicle_configurations (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references vehicle_generations(id) on delete cascade,
  slug text not null,
  engine_label text not null,
  transmission_label text not null,
  drivetrain_label text,
  fuel_type text,
  notes_uk text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generation_id, slug)
);

create index if not exists idx_vehicle_configurations_generation_id on vehicle_configurations(generation_id);

insert into vehicle_configurations (generation_id, slug, engine_label, transmission_label, drivetrain_label, fuel_type, notes_uk)
select vg.id, 'standard', 'Стандартний двигун', 'Стандартна трансмісія', null, null, 'Базова конфігурація для поколінь, де ще не деталізовано мотор і коробку.'
from vehicle_generations vg
where not exists (
  select 1 from vehicle_configurations vc where vc.generation_id = vg.id
);

with config_seed(brand_slug, model_slug, generation_slug, config_slug, engine_label, transmission_label, drivetrain_label, fuel_type, notes_uk) as (
  values
    ('honda', 'hr-v', 'ru1', '18-cvt-fwd', '1.8 i-VTEC', 'CVT', 'FWD', 'Бензин', 'Основна конфігурація HR-V RU1 для переднього приводу.'),
    ('honda', 'hr-v', 'ru1', '18-cvt-awd', '1.8 i-VTEC', 'CVT', 'AWD', 'Бензин', 'Повний привід із окремим сервісом заднього диференціала.'),
    ('honda', 'cr-v', 'rw', '20-cvt-fwd', '2.0 i-VTEC', 'CVT', 'FWD', 'Бензин', 'Атмосферний двигун для щоденної експлуатації.'),
    ('honda', 'cr-v', 'rw', '15t-cvt-awd', '1.5 VTEC Turbo', 'CVT', 'AWD', 'Бензин', 'Турбоверсія з повним приводом.'),
    ('toyota', 'corolla', 'e210', '16-cvt-fwd', '1.6 Dual VVT-i', 'CVT', 'FWD', 'Бензин', 'Найпоширеніша бензинова версія Corolla.'),
    ('toyota', 'corolla', 'e210', '18-hybrid-ecvt', '1.8 Hybrid', 'e-CVT', 'FWD', 'Гібрид', 'Гібридна силова установка e-CVT.'),
    ('toyota', 'rav4', 'xa50', '20-cvt-awd', '2.0 Valvematic', 'CVT', 'AWD', 'Бензин', 'Базова бензинова версія RAV4.'),
    ('toyota', 'rav4', 'xa50', '25-hybrid-ecvt-awd', '2.5 Hybrid', 'e-CVT', 'AWD', 'Гібрид', 'Гібридна AWD-версія.'),
    ('mazda', 'cx-5', 'kf', '20-at-fwd', '2.0 Skyactiv-G', '6AT', 'FWD', 'Бензин', 'Базовий бензиновий мотор з автоматом.'),
    ('mazda', 'cx-5', 'kf', '25-at-awd', '2.5 Skyactiv-G', '6AT', 'AWD', 'Бензин', 'Потужніша AWD-конфігурація.'),
    ('nissan', 'qashqai', 'j12', '13-xtronic-fwd', '1.3 DIG-T', 'Xtronic', 'FWD', 'Бензин', 'Турбобензин з варіатором.'),
    ('nissan', 'qashqai', 'j12', 'e-power-ecvt-fwd', 'e-Power', 'e-CVT', 'FWD', 'Гібрид', 'Серійний гібрид e-Power.'),
    ('hyundai', 'tucson', 'nx4', '20-6at-fwd', '2.0 MPI', '6AT', 'FWD', 'Бензин', 'Базова бензинова конфігурація.'),
    ('hyundai', 'tucson', 'nx4', '16t-7dct-awd', '1.6 T-GDi', '7DCT', 'AWD', 'Бензин', 'Турбоверсія з роботом і AWD.'),
    ('kia', 'sportage', 'nq5', '20-6at-fwd', '2.0 MPI', '6AT', 'FWD', 'Бензин', 'Базова бензинова версія Sportage.'),
    ('kia', 'sportage', 'nq5', '16t-7dct-awd', '1.6 T-GDi', '7DCT', 'AWD', 'Бензин', 'Турбо AWD-конфігурація.'),
    ('volkswagen', 'golf', 'mk8', '15-etsi-dsg', '1.5 eTSI', 'DSG', 'FWD', 'Бензин', 'М’який гібрид із DSG.'),
    ('volkswagen', 'golf', 'mk8', '20-tdi-dsg', '2.0 TDI', 'DSG', 'FWD', 'Дизель', 'Дизельна конфігурація для великих пробігів.'),
    ('skoda', 'octavia', 'nx', '15-tsi-dsg', '1.5 TSI', 'DSG', 'FWD', 'Бензин', 'Найпоширеніша бензинова Octavia.'),
    ('skoda', 'octavia', 'nx', '20-tdi-dsg', '2.0 TDI', 'DSG', 'FWD', 'Дизель', 'Дизельна конфігурація Octavia.'),
    ('ford', 'focus', 'mk4', '10-ecoboost-8at', '1.0 EcoBoost', '8AT', 'FWD', 'Бензин', 'Компактний бензиновий мотор із автоматом.'),
    ('ford', 'focus', 'mk4', '15-ecoblue-8at', '1.5 EcoBlue', '8AT', 'FWD', 'Дизель', 'Дизельна версія Focus Mk4.'),
    ('subaru', 'forester', 'sk', '25-cvt-awd', '2.5 Boxer', 'Lineartronic CVT', 'AWD', 'Бензин', 'Класична бензинова конфігурація Subaru AWD.'),
    ('subaru', 'forester', 'sk', '20-e-boxer-cvt-awd', '2.0 e-Boxer', 'Lineartronic CVT', 'AWD', 'Гібрид', 'М’який гібрид e-Boxer.'),
    ('mitsubishi', 'outlander', 'gn', '25-cvt-awd', '2.5 MIVEC', 'CVT', 'AWD', 'Бензин', 'Бензинова AWD-версія Outlander.'),
    ('mitsubishi', 'outlander', 'gn', '24-phev-ecvt-awd', '2.4 PHEV', 'e-CVT', 'AWD', 'PHEV', 'Плагін-гібридна версія з повним приводом.')
)
insert into vehicle_configurations (generation_id, slug, engine_label, transmission_label, drivetrain_label, fuel_type, notes_uk)
select vg.id, config_seed.config_slug, config_seed.engine_label, config_seed.transmission_label, config_seed.drivetrain_label, config_seed.fuel_type, config_seed.notes_uk
from config_seed
inner join vehicle_brands vb on vb.slug = config_seed.brand_slug
inner join vehicle_models vm on vm.brand_id = vb.id and vm.slug = config_seed.model_slug
inner join vehicle_generations vg on vg.model_id = vm.id and vg.slug = config_seed.generation_slug
on conflict (generation_id, slug) do update set
  engine_label = excluded.engine_label,
  transmission_label = excluded.transmission_label,
  drivetrain_label = excluded.drivetrain_label,
  fuel_type = excluded.fuel_type,
  notes_uk = excluded.notes_uk,
  updated_at = now();

alter table vehicles
  add column if not exists configuration_id uuid references vehicle_configurations(id) on delete restrict,
  add column if not exists deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table maintenance_schedule_templates
  add column if not exists configuration_id uuid references vehicle_configurations(id) on delete restrict;

update vehicles v
set configuration_id = (
  select vc.id
  from vehicle_configurations vc
  where vc.generation_id = v.generation_id
  order by case when vc.slug = 'standard' then 1 else 0 end, vc.created_at asc
  limit 1
)
where v.configuration_id is null;

update maintenance_schedule_templates mst
set configuration_id = (
  select vc.id
  from vehicle_configurations vc
  where vc.generation_id = mst.generation_id
  order by case when vc.slug = 'standard' then 1 else 0 end, vc.created_at asc
  limit 1
)
where mst.configuration_id is null;

alter table vehicles
  alter column configuration_id set not null;

drop index if exists idx_maintenance_schedule_templates_unique_generation_active;

create unique index if not exists idx_maintenance_schedule_templates_unique_configuration_active
  on maintenance_schedule_templates(configuration_id)
  where deleted = false;

create index if not exists idx_vehicles_configuration_id on vehicles(configuration_id);
create index if not exists idx_vehicles_deleted on vehicles(user_id, deleted);
create index if not exists idx_maintenance_schedule_templates_configuration_id on maintenance_schedule_templates(configuration_id);

with source_templates as (
  select mst.id, mst.name_uk, mst.notes_uk, vc.generation_id, vc.slug as source_configuration_slug
  from maintenance_schedule_templates mst
  inner join vehicle_configurations vc on vc.id = mst.configuration_id
  where mst.deleted = false
    and vc.slug in (
      '18-cvt-fwd', '20-cvt-fwd', '16-cvt-fwd', '20-cvt-awd', '20-at-fwd',
      '13-xtronic-fwd', '20-6at-fwd', '15-etsi-dsg', '15-tsi-dsg',
      '10-ecoboost-8at', '25-cvt-awd', '25-cvt-awd'
    )
), clone_targets(source_configuration_slug, target_configuration_slug, title_suffix, notes_suffix) as (
  values
    ('18-cvt-fwd', '18-cvt-awd', ' AWD', 'Додано вимоги для повного приводу.'),
    ('20-cvt-fwd', '15t-cvt-awd', ' Turbo AWD', 'Окремий шаблон для турбомотора і AWD.'),
    ('16-cvt-fwd', '18-hybrid-ecvt', ' Hybrid', 'Окремий цикл для гібридної трансмісії e-CVT.'),
    ('20-cvt-awd', '25-hybrid-ecvt-awd', ' Hybrid AWD', 'Гібридна AWD-версія з іншою трансмісією.'),
    ('20-at-fwd', '25-at-awd', ' AWD', 'Більш потужний бензиновий мотор з AWD.'),
    ('13-xtronic-fwd', 'e-power-ecvt-fwd', ' e-Power', 'Окремий шаблон для системи e-Power.'),
    ('20-6at-fwd', '16t-7dct-awd', ' Turbo AWD', 'Роботизована трансмісія і AWD-конфігурація.'),
    ('15-etsi-dsg', '20-tdi-dsg', ' TDI', 'Дизельна DSG-версія.'),
    ('15-tsi-dsg', '20-tdi-dsg', ' TDI', 'Дизельна DSG-конфігурація.'),
    ('10-ecoboost-8at', '15-ecoblue-8at', ' Diesel', 'Дизельний мотор для великих пробігів.'),
    ('25-cvt-awd', '20-e-boxer-cvt-awd', ' e-Boxer', 'Гібридна конфігурація e-Boxer.'),
    ('25-cvt-awd', '24-phev-ecvt-awd', ' PHEV', 'Плагін-гібрид із e-CVT і AWD.')
), resolved_clone_targets as (
  select
    source_templates.id as source_template_id,
    source_templates.name_uk,
    source_templates.notes_uk,
    target_vc.id as target_configuration_id,
    target_vc.generation_id,
    clone_targets.title_suffix,
    clone_targets.notes_suffix
  from source_templates
  inner join clone_targets on clone_targets.source_configuration_slug = source_templates.source_configuration_slug
  inner join vehicle_configurations target_vc on target_vc.generation_id = source_templates.generation_id and target_vc.slug = clone_targets.target_configuration_slug
), inserted_templates as (
  insert into maintenance_schedule_templates (name_uk, generation_id, configuration_id, notes_uk)
  select
    concat(resolved_clone_targets.name_uk, resolved_clone_targets.title_suffix),
    resolved_clone_targets.generation_id,
    resolved_clone_targets.target_configuration_id,
    concat_ws(' ', resolved_clone_targets.notes_uk, resolved_clone_targets.notes_suffix)
  from resolved_clone_targets
  where not exists (
    select 1 from maintenance_schedule_templates mst
    where mst.configuration_id = resolved_clone_targets.target_configuration_id and mst.deleted = false
  )
  returning id, configuration_id
), all_new_templates as (
  select mst.id as template_id, mst.configuration_id, resolved_clone_targets.source_template_id
  from maintenance_schedule_templates mst
  inner join resolved_clone_targets on resolved_clone_targets.target_configuration_id = mst.configuration_id
  where mst.deleted = false
)
insert into maintenance_schedule_items (template_id, procedure_id, interval_km, interval_months, notes_uk)
select
  all_new_templates.template_id,
  msi.procedure_id,
  msi.interval_km,
  msi.interval_months,
  case
    when vc.fuel_type in ('Гібрид', 'PHEV') and mp.code = 'spark-plugs' then coalesce(msi.notes_uk, '') || ' Уточнюйте інтервал залежно від частки роботи ДВЗ.'
    when vc.drivetrain_label = 'AWD' and mp.code = 'transmission-fluid' then coalesce(msi.notes_uk, '') || ' Для AWD також контролюйте стан вузлів повного приводу.'
    when vc.fuel_type = 'Дизель' and mp.code = 'air-filter' then coalesce(msi.notes_uk, '') || ' Для дизельних версій приділяйте окрему увагу фільтрації повітря та пального.'
    else msi.notes_uk
  end
from all_new_templates
inner join maintenance_schedule_items msi on msi.template_id = all_new_templates.source_template_id and msi.deleted = false
inner join maintenance_procedures mp on mp.id = msi.procedure_id and mp.deleted = false
inner join vehicle_configurations vc on vc.id = all_new_templates.configuration_id
on conflict (template_id, procedure_id) do update set
  interval_km = excluded.interval_km,
  interval_months = excluded.interval_months,
  notes_uk = excluded.notes_uk,
  deleted = false,
  deleted_at = null,
  updated_at = now();