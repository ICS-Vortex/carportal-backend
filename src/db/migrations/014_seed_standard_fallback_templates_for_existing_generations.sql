with candidate_generations as (
  select distinct
    vg.id as generation_id,
    standard_vc.id as standard_configuration_id
  from vehicle_generations vg
  inner join vehicle_configurations standard_vc on standard_vc.generation_id = vg.id and standard_vc.slug = 'standard'
  where exists (
    select 1
    from maintenance_schedule_templates mst
    where mst.generation_id = vg.id
      and mst.deleted = false
  )
    and not exists (
      select 1
      from maintenance_schedule_templates mst
      where mst.configuration_id = standard_vc.id
        and mst.deleted = false
    )
), source_templates as (
  select distinct on (candidate_generations.generation_id)
    candidate_generations.generation_id,
    candidate_generations.standard_configuration_id,
    mst.id as source_template_id,
    mst.name_uk,
    mst.notes_uk
  from candidate_generations
  inner join maintenance_schedule_templates mst on mst.generation_id = candidate_generations.generation_id and mst.deleted = false
  left join vehicle_configurations source_vc on source_vc.id = mst.configuration_id
  order by candidate_generations.generation_id,
    case when source_vc.slug = 'standard' then 1 else 0 end asc,
    mst.created_at asc
), inserted_templates as (
  insert into maintenance_schedule_templates (name_uk, generation_id, configuration_id, notes_uk)
  select
    concat(source_templates.name_uk, ' стандартна конфігурація'),
    source_templates.generation_id,
    source_templates.standard_configuration_id,
    concat_ws(' ', source_templates.notes_uk, 'Універсальний fallback для авто, створених до уточнення двигуна і трансмісії.')
  from source_templates
  returning id, generation_id, configuration_id
), template_map as (
  select
    inserted_templates.id as template_id,
    source_templates.source_template_id
  from inserted_templates
  inner join source_templates on source_templates.generation_id = inserted_templates.generation_id and source_templates.standard_configuration_id = inserted_templates.configuration_id
), source_items as (
  select
    template_map.template_id,
    msi.procedure_id,
    msi.interval_km,
    msi.interval_months,
    case
      when mp.code in ('rear-differential-fluid', 'transfer-case-fluid') then 'Перевірте, чи ця операція актуальна для вашої точної конфігурації після її уточнення в гаражі.'
      else msi.notes_uk
    end as notes_uk
  from template_map
  inner join maintenance_schedule_items msi on msi.template_id = template_map.source_template_id and msi.deleted = false
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