alter table vehicle_maintenance_plan_items
  add column if not exists baseline_date date,
  add column if not exists baseline_mileage_km integer;

update vehicle_maintenance_plan_items item
set
  baseline_date = coalesce(item.baseline_date, item.last_completed_at, plan.assigned_at::date, current_date),
  baseline_mileage_km = coalesce(item.baseline_mileage_km, item.last_completed_mileage_km, vehicle.mileage_km, 0)
from vehicle_maintenance_plans plan
inner join vehicles vehicle on vehicle.id = plan.vehicle_id
where item.plan_id = plan.id
  and (item.baseline_date is null or item.baseline_mileage_km is null);

alter table vehicle_maintenance_plan_items
  alter column baseline_date set default current_date,
  alter column baseline_date set not null,
  alter column baseline_mileage_km set default 0,
  alter column baseline_mileage_km set not null;