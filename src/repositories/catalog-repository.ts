import { pool } from "../db/pool";
import type { ProcedureRecord, VehicleConfigurationRecord, VehicleGenerationRecord } from "../types/models";

export type VehicleCatalogTree = {
  brands: Array<{
    id: string;
    slug: string;
    name: string;
    models: Array<{
      id: string;
      slug: string;
      name: string;
      generations: Array<{
        id: string;
        slug: string;
        name: string;
        year_from: number;
        year_to: number;
        notes_uk: string | null;
        configurations: Array<{
          id: string;
          slug: string;
          engine_label: string;
          transmission_label: string;
          drivetrain_label: string | null;
          fuel_type: string | null;
          notes_uk: string | null;
        }>;
      }>;
    }>;
  }>;
};

export type ScheduleRow = {
  schedule_item_id: string;
  template_id: string;
  template_name: string;
  generation_id: string;
  configuration_id: string | null;
  vehicle_make: string;
  vehicle_model: string;
  generation_code: string | null;
  configuration_label: string | null;
  engine_name: string | null;
  transmission_name: string | null;
  drivetrain_label: string | null;
  year_from: number | null;
  year_to: number | null;
  procedure_id: string;
  procedure_title: string;
  interval_km: number | null;
  interval_months: number | null;
  notes_uk: string | null;
  labor_price_uah: number | null;
};

type VehicleCatalogRow = {
  brand_id: string;
  brand_slug: string;
  brand_name: string;
  model_id: string;
  model_slug: string;
  model_name: string;
  generation_id: string;
  generation_slug: string;
  generation_name: string;
  year_from: number;
  year_to: number;
  generation_notes_uk: string | null;
  configuration_id: string;
  configuration_slug: string;
  configuration_engine_label: string;
  configuration_transmission_label: string;
  configuration_drivetrain_label: string | null;
  configuration_fuel_type: string | null;
  configuration_notes_uk: string | null;
};

export async function listProcedures(): Promise<ProcedureRecord[]> {
  const result = await pool.query<ProcedureRecord>(
    "select * from maintenance_procedures where deleted = false order by category asc, title_uk asc"
  );
  return result.rows;
}

export async function listVehicleCatalog(): Promise<VehicleCatalogTree> {
  const result = await pool.query<VehicleCatalogRow>(`
    select
      vb.id as brand_id,
      vb.slug as brand_slug,
      vb.name as brand_name,
      vm.id as model_id,
      vm.slug as model_slug,
      vm.name as model_name,
      vg.id as generation_id,
      vg.slug as generation_slug,
      vg.name as generation_name,
      vg.year_from,
      vg.year_to,
      vg.notes_uk as generation_notes_uk,
      vc.id as configuration_id,
      vc.slug as configuration_slug,
      vc.engine_label as configuration_engine_label,
      vc.transmission_label as configuration_transmission_label,
      vc.drivetrain_label as configuration_drivetrain_label,
      vc.fuel_type as configuration_fuel_type,
      vc.notes_uk as configuration_notes_uk
    from vehicle_brands vb
    inner join vehicle_models vm on vm.brand_id = vb.id
    inner join vehicle_generations vg on vg.model_id = vm.id
    inner join vehicle_configurations vc on vc.generation_id = vg.id
    order by vb.name asc, vm.name asc, vg.year_from asc, vg.name asc,
      case when vc.slug = 'standard' then 1 else 0 end asc,
      vc.engine_label asc,
      vc.transmission_label asc,
      coalesce(vc.drivetrain_label, '') asc
  `);

  const brands = result.rows.reduce<VehicleCatalogTree["brands"]>((acc, row) => {
    let brand = acc.find((item) => item.id === row.brand_id);

    if (!brand) {
      brand = { id: row.brand_id, slug: row.brand_slug, name: row.brand_name, models: [] };
      acc.push(brand);
    }

    let model = brand.models.find((item) => item.id === row.model_id);

    if (!model) {
      model = { id: row.model_id, slug: row.model_slug, name: row.model_name, generations: [] };
      brand.models.push(model);
    }

    let generation = model.generations.find((item) => item.id === row.generation_id);

    if (!generation) {
      generation = {
        id: row.generation_id,
        slug: row.generation_slug,
        name: row.generation_name,
        year_from: row.year_from,
        year_to: row.year_to,
        notes_uk: row.generation_notes_uk,
        configurations: []
      };
      model.generations.push(generation);
    }

    generation.configurations.push({
      id: row.configuration_id,
      slug: row.configuration_slug,
      engine_label: row.configuration_engine_label,
      transmission_label: row.configuration_transmission_label,
      drivetrain_label: row.configuration_drivetrain_label,
      fuel_type: row.configuration_fuel_type,
      notes_uk: row.configuration_notes_uk
    });

    return acc;
  }, []);

  return { brands };
}

export async function findVehicleGenerationById(generationId: string): Promise<(VehicleGenerationRecord & {
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
}) | null> {
  const result = await pool.query<VehicleGenerationRecord & {
    brand_id: string;
    brand_name: string;
    model_id: string;
    model_name: string;
  }>(`
    select
      vg.*,
      vm.id as model_id,
      vm.name as model_name,
      vb.id as brand_id,
      vb.name as brand_name
    from vehicle_generations vg
    inner join vehicle_models vm on vm.id = vg.model_id
    inner join vehicle_brands vb on vb.id = vm.brand_id
    where vg.id = $1
    limit 1
  `, [generationId]);

  return result.rows[0] ?? null;
}

export async function findVehicleConfigurationById(configurationId: string): Promise<(VehicleConfigurationRecord & {
  generation_name: string;
  year_from: number;
  year_to: number;
  model_id: string;
  model_name: string;
  brand_id: string;
  brand_name: string;
}) | null> {
  const result = await pool.query<VehicleConfigurationRecord & {
    generation_name: string;
    year_from: number;
    year_to: number;
    model_id: string;
    model_name: string;
    brand_id: string;
    brand_name: string;
  }>(`
    select
      vc.*,
      vg.name as generation_name,
      vg.year_from,
      vg.year_to,
      vm.id as model_id,
      vm.name as model_name,
      vb.id as brand_id,
      vb.name as brand_name
    from vehicle_configurations vc
    inner join vehicle_generations vg on vg.id = vc.generation_id
    inner join vehicle_models vm on vm.id = vg.model_id
    inner join vehicle_brands vb on vb.id = vm.brand_id
    where vc.id = $1
    limit 1
  `, [configurationId]);

  return result.rows[0] ?? null;
}

export async function resolveVehicleGenerationByDescriptor(input: {
  vehicleMake: string;
  vehicleModel: string;
  generationCode?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
}): Promise<(VehicleGenerationRecord & {
  brand_name: string;
  model_name: string;
}) | null> {
  if (!input.generationCode) {
    return null;
  }

  const result = await pool.query<VehicleGenerationRecord & {
    brand_name: string;
    model_name: string;
  }>(`
    select
      vg.*, vb.name as brand_name, vm.name as model_name
    from vehicle_generations vg
    inner join vehicle_models vm on vm.id = vg.model_id
    inner join vehicle_brands vb on vb.id = vm.brand_id
    where lower(vb.name) = lower($1)
      and lower(vm.name) = lower($2)
      and lower(vg.name) = lower($3)
      and ($4::int is null or vg.year_to >= $4)
      and ($5::int is null or vg.year_from <= $5)
    order by vg.year_from asc
    limit 1
  `, [input.vehicleMake, input.vehicleModel, input.generationCode, input.yearFrom ?? null, input.yearTo ?? null]);

  return result.rows[0] ?? null;
}

export async function listScheduleTemplateHeaders(): Promise<Array<{
  id: string;
  name_uk: string;
  generation_id: string;
  configuration_id: string | null;
  vehicle_make: string;
  vehicle_model: string;
  generation_code: string | null;
  configuration_label: string | null;
  engine_name: string | null;
  transmission_name: string | null;
  drivetrain_label: string | null;
  year_from: number | null;
  year_to: number | null;
  notes_uk: string | null;
}>> {
  const result = await pool.query(`
    select
      mst.id,
      mst.name_uk,
      mst.generation_id,
      mst.configuration_id,
      vb.name as vehicle_make,
      vm.name as vehicle_model,
      vg.name as generation_code,
      case
        when vc.id is null then null
        else concat(vc.engine_label, ' / ', vc.transmission_label, coalesce(concat(' / ', vc.drivetrain_label), ''))
      end as configuration_label,
      vc.engine_label as engine_name,
      vc.transmission_label as transmission_name,
      vc.drivetrain_label,
      vg.year_from,
      vg.year_to,
      mst.notes_uk
    from maintenance_schedule_templates mst
    inner join vehicle_generations vg on vg.id = mst.generation_id
    inner join vehicle_models vm on vm.id = vg.model_id
    inner join vehicle_brands vb on vb.id = vm.brand_id
    left join vehicle_configurations vc on vc.id = mst.configuration_id
    where mst.deleted = false
    order by vb.name asc, vm.name asc, vg.year_from asc, mst.name_uk asc
  `);

  return result.rows;
}

export async function listScheduleTemplates(): Promise<ScheduleRow[]> {
  const result = await pool.query<ScheduleRow>(`
    select
      msi.id as schedule_item_id,
      mst.id as template_id,
      mst.name_uk as template_name,
      mst.generation_id,
      mst.configuration_id,
      vb.name as vehicle_make,
      vm.name as vehicle_model,
      vg.name as generation_code,
      case
        when vc.id is null then null
        else concat(vc.engine_label, ' / ', vc.transmission_label, coalesce(concat(' / ', vc.drivetrain_label), ''))
      end as configuration_label,
      vc.engine_label as engine_name,
      vc.transmission_label as transmission_name,
      vc.drivetrain_label,
      vg.year_from,
      vg.year_to,
      msi.procedure_id,
      mp.title_uk as procedure_title,
      msi.interval_km,
      msi.interval_months,
      msi.notes_uk,
      COALESCE(msi.labor_price_uah, mp.labor_price_uah) as labor_price_uah
    from maintenance_schedule_templates mst
    inner join vehicle_generations vg on vg.id = mst.generation_id
    inner join vehicle_models vm on vm.id = vg.model_id
    inner join vehicle_brands vb on vb.id = vm.brand_id
    left join vehicle_configurations vc on vc.id = mst.configuration_id
    inner join maintenance_schedule_items msi on msi.template_id = mst.id and msi.deleted = false
    inner join maintenance_procedures mp on mp.id = msi.procedure_id and mp.deleted = false
    where mst.deleted = false
    order by vb.name asc, vm.name asc, vg.year_from asc, mst.name_uk asc, mp.category asc, mp.title_uk asc
  `);

  return result.rows;
}
