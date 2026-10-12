import { pool } from "../db/pool";
import type { VehicleRecord } from "../types/models";

const vehicleSelect = `
  select
    v.id,
    v.user_id,
    v.generation_id,
    v.configuration_id,
    vb.name as make,
    vm.name as model,
    vg.name as generation,
    vc.engine_label as engine_name,
    vc.transmission_label as transmission_name,
    vc.drivetrain_label,
    vc.fuel_type,
    v.year,
    v.vin,
    v.license_plate,
    v.image_url,
    v.mileage_km,
    (
      select sl.service_date::text
      from service_logs sl
      where sl.vehicle_id = v.id
      order by sl.service_date desc, sl.created_at desc
      limit 1
    ) as last_service_date,
    (
      select sl.mileage_km
      from service_logs sl
      where sl.vehicle_id = v.id
      order by sl.service_date desc, sl.created_at desc
      limit 1
    ) as last_service_mileage_km,
    exists (
      select 1
      from vehicle_maintenance_plans vmp
      where vmp.vehicle_id = v.id
    ) as has_maintenance_plan,
    v.deleted,
    v.deleted_at,
    v.created_at,
    v.updated_at
  from vehicles v
  inner join vehicle_generations vg on vg.id = v.generation_id
  inner join vehicle_configurations vc on vc.id = v.configuration_id
  inner join vehicle_models vm on vm.id = vg.model_id
  inner join vehicle_brands vb on vb.id = vm.brand_id
`;

export async function listVehiclesByUser(userId: string): Promise<VehicleRecord[]> {
  const result = await pool.query<VehicleRecord>(
    `${vehicleSelect} where v.user_id = $1 and v.deleted = false order by v.created_at desc`,
    [userId]
  );
  return result.rows;
}

export async function createVehicle(input: {
  userId: string;
  configurationId: string;
  generationId: string;
  year: number;
  vin?: string | null;
  licensePlate?: string | null;
  imageUrl?: string | null;
  mileageKm: number;
}): Promise<VehicleRecord> {
  const inserted = await pool.query<{ id: string }>(
    `
      insert into vehicles (id, user_id, generation_id, configuration_id, year, vin, license_plate, image_url, mileage_km, created_at, updated_at)
      values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now(), now())
      returning id
    `,
    [
      input.userId,
      input.generationId,
      input.configurationId,
      input.year,
      input.vin ?? null,
      input.licensePlate ?? null,
      input.imageUrl ?? null,
      input.mileageKm
    ]
  );

  return (await findVehicleByIdForUser(inserted.rows[0].id, input.userId))!;
}

export async function findVehicleByIdForUser(vehicleId: string, userId: string): Promise<VehicleRecord | null> {
  const result = await pool.query<VehicleRecord>(
    `${vehicleSelect} where v.id = $1 and v.user_id = $2 and v.deleted = false limit 1`,
    [vehicleId, userId]
  );

  return result.rows[0] ?? null;
}

export async function updateVehicleMileage(vehicleId: string, userId: string, mileageKm: number): Promise<VehicleRecord | null> {
  const updated = await pool.query<{ id: string }>(
    `
      update vehicles
      set mileage_km = $3, updated_at = now()
      where id = $1 and user_id = $2 and deleted = false
      returning id
    `,
    [vehicleId, userId, mileageKm]
  );

  if (!updated.rows[0]) {
    return null;
  }

  return findVehicleByIdForUser(updated.rows[0].id, userId);
}

export async function updateVehicleDetails(input: {
  vehicleId: string;
  userId: string;
  configurationId: string;
  generationId: string;
  year: number;
  vin?: string | null;
  licensePlate?: string | null;
  imageUrl?: string | null;
  mileageKm: number;
}): Promise<VehicleRecord | null> {
  const updated = await pool.query<{ id: string }>(
    `
      update vehicles
      set generation_id = $3,
          configuration_id = $4,
          year = $5,
          vin = $6,
          license_plate = $7,
          image_url = $8,
          mileage_km = $9,
          updated_at = now()
      where id = $1 and user_id = $2 and deleted = false
      returning id
    `,
    [
      input.vehicleId,
      input.userId,
      input.generationId,
      input.configurationId,
      input.year,
      input.vin ?? null,
      input.licensePlate ?? null,
      input.imageUrl ?? null,
      input.mileageKm
    ]
  );

  if (!updated.rows[0]) {
    return null;
  }

  return findVehicleByIdForUser(updated.rows[0].id, input.userId);
}

export async function softDeleteVehicle(vehicleId: string, userId: string): Promise<VehicleRecord | null> {
  const updated = await pool.query<{ id: string }>(
    `
      update vehicles
      set deleted = true,
          deleted_at = now(),
          updated_at = now()
      where id = $1 and user_id = $2 and deleted = false
      returning id
    `,
    [vehicleId, userId]
  );

  if (!updated.rows[0]) {
    return null;
  }

  const result = await pool.query<VehicleRecord>(
    `${vehicleSelect} where v.id = $1 and v.user_id = $2 limit 1`,
    [vehicleId, userId]
  );

  return result.rows[0] ?? null;
}
