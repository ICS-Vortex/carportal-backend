import { pool } from "../db/pool";
import { syncPlanItemsWithHistoricalServiceLogs, syncPlanItemsWithServiceLog } from "./maintenance-repository";
import type { ServiceLogRecord } from "../types/models";

type ServiceLogItemInput = {
  procedureId: string;
  notesUk?: string | null;
};

type ServiceLogWithItems = ServiceLogRecord & {
  items: Array<{
    procedure_id: string;
    title_uk: string;
    notes_uk: string | null;
  }>;
};

export async function listServiceLogsByVehicle(vehicleId: string, userId: string): Promise<ServiceLogWithItems[]> {
  const logsResult = await pool.query<ServiceLogRecord>(
    `
      select sl.*
      from service_logs sl
      inner join vehicles v on v.id = sl.vehicle_id
      where sl.vehicle_id = $1 and v.user_id = $2 and v.deleted = false
      order by sl.service_date desc, sl.created_at desc
    `,
    [vehicleId, userId]
  );

  if (logsResult.rows.length === 0) {
    return [];
  }

  const ids = logsResult.rows.map((row) => row.id);
  const itemsResult = await pool.query<{
    service_log_id: string;
    procedure_id: string;
    title_uk: string;
    notes_uk: string | null;
  }>(
    `
      select sli.service_log_id, sli.procedure_id, mp.title_uk, sli.notes_uk
      from service_log_items sli
      inner join maintenance_procedures mp on mp.id = sli.procedure_id
      where sli.service_log_id = any($1::uuid[])
      order by mp.title_uk asc
    `,
    [ids]
  );

  return logsResult.rows.map((row) => ({
    ...row,
    items: itemsResult.rows.filter((item) => item.service_log_id === row.id)
  }));
}

export async function createServiceLog(input: {
  vehicleId: string;
  serviceDate: string;
  mileageKm: number;
  serviceStation?: string | null;
  serviceStationId?: string | null;
  notesUk?: string | null;
  items: ServiceLogItemInput[];
}): Promise<ServiceLogRecord> {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const logResult = await client.query<ServiceLogRecord>(
      `
        insert into service_logs (id, vehicle_id, service_date, mileage_km, service_station, service_station_id, notes_uk, created_at)
        values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now())
        returning *
      `,
      [
        input.vehicleId,
        input.serviceDate,
        input.mileageKm,
        input.serviceStation ?? null,
        input.serviceStationId ?? null,
        input.notesUk ?? null
      ]
    );

    for (const item of input.items) {
      await client.query(
        `
          insert into service_log_items (id, service_log_id, procedure_id, notes_uk, created_at)
          values (gen_random_uuid(), $1, $2, $3, now())
        `,
        [logResult.rows[0].id, item.procedureId, item.notesUk ?? null]
      );
    }

    await client.query(
      "update vehicles set mileage_km = greatest(mileage_km, $2), updated_at = now() where id = $1 and deleted = false",
      [input.vehicleId, input.mileageKm]
    );

    await syncPlanItemsWithServiceLog(client, {
      vehicleId: input.vehicleId,
      serviceLogId: logResult.rows[0].id,
      serviceDate: input.serviceDate,
      mileageKm: input.mileageKm,
      procedureIds: input.items.map((item) => item.procedureId)
    });

    await client.query("commit");
    return logResult.rows[0];
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteServiceLog(input: {
  vehicleId: string;
  serviceLogId: string;
  userId: string;
}): Promise<ServiceLogRecord | null> {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const existingResult = await client.query<ServiceLogRecord>(
      `
        select sl.*
        from service_logs sl
        inner join vehicles v on v.id = sl.vehicle_id
        where sl.id = $1
          and sl.vehicle_id = $2
          and v.user_id = $3
          and v.deleted = false
        limit 1
      `,
      [input.serviceLogId, input.vehicleId, input.userId]
    );

    const existingLog = existingResult.rows[0] ?? null;

    if (!existingLog) {
      await client.query("rollback");
      return null;
    }

    await client.query(
      `
        delete from service_logs
        where id = $1
          and vehicle_id = $2
      `,
      [input.serviceLogId, input.vehicleId]
    );

    await client.query(
      `
        update vehicle_maintenance_plan_items item
        set status = 'pending',
            last_completed_at = null,
            last_completed_mileage_km = null,
            last_service_log_id = null,
            updated_at = now()
        from vehicle_maintenance_plans plan
        where item.plan_id = plan.id
          and plan.vehicle_id = $1
          and item.last_service_log_id = $2
      `,
      [input.vehicleId, input.serviceLogId]
    );

    await syncPlanItemsWithHistoricalServiceLogs({ vehicleId: input.vehicleId, client });

    await client.query("commit");
    return existingLog;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
