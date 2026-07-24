import type { PoolClient } from "pg";

import { pool } from "../db/pool";
import type { MaintenancePlanRequestRecord, VehicleRecord, VehicleMaintenancePlanItemRecord, VehicleMaintenancePlanRecord } from "../types/models";

type TemplateHeader = {
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
  item_count: number;
};

type TemplateVersion = {
  id: string;
  name_uk: string;
  last_changed_at: Date;
};

type TemplateItemRow = {
  procedure_id: string;
  procedure_title: string;
  procedure_category: string;
  interval_km: number | null;
  interval_months: number | null;
  notes_uk: string | null;
};

export type VehicleMaintenancePlanView = {
  vehicle: VehicleRecord;
  plan: VehicleMaintenancePlanRecord | null;
  items: Array<VehicleMaintenancePlanItemRecord & {
    current_status: "pending" | "done" | "skipped" | "overdue";
    done: boolean;
    next_due_date: string | null;
    next_due_mileage_km: number | null;
    overdue_by_days: number | null;
    overdue_by_km: number | null;
  }>;
  availableTemplates: TemplateHeader[];
  templateSync: {
    isStale: boolean;
    wasAutoReassigned: boolean;
    latestTemplateUpdatedAt: string | null;
    message: string | null;
  };
  missingPlanRequest: {
    id: string;
    status: "open" | "resolved";
    request_note: string | null;
    created_at: string;
  } | null;
};

type MissingPlanRequestSummary = {
  id: string;
  status: "open" | "resolved";
  request_note: string | null;
  created_at: Date;
};

function normalizeDateOnly(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function parseDateOnly(value: string | Date): Date {
  const normalized = normalizeDateOnly(value);
  return new Date(`${normalized}T00:00:00.000Z`);
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addMonthsToDate(value: string | Date, months: number): string {
  const date = parseDateOnly(value);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDayOfMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDayOfMonth));
  return formatDateOnly(target);
}

function getTodayDateOnly(): string {
  return formatDateOnly(new Date());
}

function differenceInDays(start: string | Date, end: string | Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((parseDateOnly(end).getTime() - parseDateOnly(start).getTime()) / millisecondsPerDay);
}

function deriveItemState(item: VehicleMaintenancePlanItemRecord, currentMileageKm: number) {
  const baselineDate = normalizeDateOnly(item.baseline_date);
  const lastCompletedAt = item.last_completed_at ? normalizeDateOnly(item.last_completed_at) : null;
  const referenceMileageKm = item.last_completed_mileage_km ?? item.baseline_mileage_km;
  const referenceDate = lastCompletedAt ?? baselineDate;
  const nextDueMileageKm =
    item.interval_km !== null
      ? referenceMileageKm + item.interval_km
      : null;
  const nextDueDate =
    item.interval_months !== null
      ? addMonthsToDate(referenceDate, item.interval_months)
      : null;
  const overdueByKm = nextDueMileageKm !== null && currentMileageKm > nextDueMileageKm
    ? currentMileageKm - nextDueMileageKm
    : null;
  const today = getTodayDateOnly();
  const overdueByDays = nextDueDate !== null && today > nextDueDate
    ? differenceInDays(nextDueDate, today)
    : null;

  const isOverdue = item.status !== "skipped" && (overdueByKm !== null || overdueByDays !== null);

  const currentStatus: "pending" | "done" | "skipped" | "overdue" = isOverdue ? "overdue" : item.status;

  return {
    ...item,
    baseline_date: baselineDate,
    current_status: currentStatus,
    done: item.status === "done",
    last_completed_at: lastCompletedAt,
    next_due_date: nextDueDate,
    next_due_mileage_km: nextDueMileageKm,
    overdue_by_days: overdueByDays,
    overdue_by_km: overdueByKm
  };
}

export async function findMatchingTemplatesForVehicle(vehicle: VehicleRecord): Promise<TemplateHeader[]> {
  const result = await pool.query<TemplateHeader>(
    `
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
        mst.notes_uk,
        count(msi.id)::int as item_count
      from maintenance_schedule_templates mst
      inner join vehicle_generations vg on vg.id = mst.generation_id
      inner join vehicle_models vm on vm.id = vg.model_id
      inner join vehicle_brands vb on vb.id = vm.brand_id
      left join vehicle_configurations vc on vc.id = mst.configuration_id
      left join maintenance_schedule_items msi on msi.template_id = mst.id and msi.deleted = false
      where mst.deleted = false
        and (
          mst.configuration_id = $1
          or (mst.configuration_id is null and mst.generation_id = $2)
        )
      group by mst.id, mst.name_uk, mst.generation_id, mst.configuration_id, vb.name, vm.name, vg.name, vc.id, vc.engine_label, vc.transmission_label, vc.drivetrain_label, vg.year_from, vg.year_to, mst.notes_uk
      order by case when mst.configuration_id = $1 then 0 else 1 end asc, mst.name_uk asc
    `,
    [vehicle.configuration_id, vehicle.generation_id]
  );

  return result.rows;
}

export async function syncVehiclePlanForVehicleCatalogChange(vehicle: VehicleRecord): Promise<void> {
  const existingPlanResult = await pool.query<{
    id: string;
    template_id: string | null;
    template_generation_id: string | null;
    template_configuration_id: string | null;
  }>(
    `
      select
        plan.id,
        plan.template_id,
        mst.generation_id as template_generation_id,
        mst.configuration_id as template_configuration_id
      from vehicle_maintenance_plans plan
      left join maintenance_schedule_templates mst on mst.id = plan.template_id
      where plan.vehicle_id = $1
      limit 1
    `,
    [vehicle.id]
  );

  const existingPlan = existingPlanResult.rows[0] ?? null;

  if (existingPlan && existingPlan.template_configuration_id === vehicle.configuration_id) {
    return;
  }

  if (existingPlan) {
    await pool.query("delete from vehicle_maintenance_plans where id = $1", [existingPlan.id]);
  }

  const availableTemplates = await findMatchingTemplatesForVehicle(vehicle);

  if (availableTemplates.length === 1) {
    await assignTemplateToVehicle(vehicle, availableTemplates[0].id);
  }
}

async function getOpenMissingPlanRequest(vehicleId: string, userId: string): Promise<MissingPlanRequestSummary | null> {
  const result = await pool.query<MissingPlanRequestSummary>(
    `
      select id, status, request_note, created_at
      from maintenance_plan_requests
      where vehicle_id = $1
        and user_id = $2
        and status = 'open'
      order by created_at desc
      limit 1
    `,
    [vehicleId, userId]
  );

  return result.rows[0] ?? null;
}

async function resolveOpenMissingPlanRequestsForVehicle(vehicleId: string, client: PoolClient | typeof pool = pool): Promise<void> {
  await client.query(
    `
      update maintenance_plan_requests
      set status = 'resolved',
          handled_at = now(),
          updated_at = now()
      where vehicle_id = $1
        and status = 'open'
    `,
    [vehicleId]
  );
}

async function getTemplateVersion(templateId: string, client: PoolClient | typeof pool = pool): Promise<TemplateVersion | null> {
  const result = await client.query<TemplateVersion>(
    `
      select
        mst.id,
        mst.name_uk,
        greatest(
          mst.updated_at,
          coalesce(max(msi.updated_at), mst.updated_at),
          coalesce(max(mp.updated_at), mst.updated_at)
        ) as last_changed_at
      from maintenance_schedule_templates mst
      left join maintenance_schedule_items msi on msi.template_id = mst.id and msi.deleted = false
      left join maintenance_procedures mp on mp.id = msi.procedure_id and mp.deleted = false
      where mst.id = $1
        and mst.deleted = false
      group by mst.id
    `,
    [templateId]
  );

  return result.rows[0] ?? null;
}

function canAutoReassignPlan(items: VehicleMaintenancePlanItemRecord[]): boolean {
  return items.every((item) => (
    item.status === "pending"
    && item.last_completed_at === null
    && item.last_completed_mileage_km === null
    && item.last_service_log_id === null
  ));
}

async function getTemplateItems(templateId: string, client: PoolClient | typeof pool = pool): Promise<TemplateItemRow[]> {
  const result = await client.query<TemplateItemRow>(
    `
      select
        mp.id as procedure_id,
        mp.title_uk as procedure_title,
        mp.category as procedure_category,
        msi.interval_km,
        msi.interval_months,
        msi.notes_uk
      from maintenance_schedule_items msi
      inner join maintenance_procedures mp on mp.id = msi.procedure_id and mp.deleted = false
      where msi.template_id = $1
        and msi.deleted = false
      order by mp.category asc, mp.title_uk asc
    `,
    [templateId]
  );

  return result.rows;
}

export async function syncPlanItemsWithHistoricalServiceLogs(input: {
  vehicleId?: string;
  userId?: string;
  client?: PoolClient | typeof pool;
} = {}): Promise<void> {
  const client = input.client ?? pool;
  const vehicleId = input.vehicleId ?? null;
  const userId = input.userId ?? null;

  await client.query(
    `
      with matched_logs as (
        select distinct on (item.id)
          item.id as plan_item_id,
          sl.id as service_log_id,
          sl.service_date,
          sl.mileage_km
        from vehicle_maintenance_plan_items item
        inner join vehicle_maintenance_plans plan on plan.id = item.plan_id
        inner join vehicles v on v.id = plan.vehicle_id
        inner join service_log_items sli on sli.procedure_id = item.procedure_id
        inner join service_logs sl on sl.id = sli.service_log_id and sl.vehicle_id = plan.vehicle_id
        where v.deleted = false
          and item.procedure_id is not null
          and item.last_completed_at is null
          and item.last_completed_mileage_km is null
          and item.last_service_log_id is null
          and ($1::uuid is null or plan.vehicle_id = $1)
          and ($2::uuid is null or v.user_id = $2)
        order by item.id, sl.service_date desc, sl.created_at desc
      )
      update vehicle_maintenance_plan_items item
      set baseline_date = matched_logs.service_date,
          baseline_mileage_km = matched_logs.mileage_km,
          last_completed_at = matched_logs.service_date,
          last_completed_mileage_km = matched_logs.mileage_km,
          last_service_log_id = matched_logs.service_log_id,
          status = 'done',
          updated_at = now()
      from matched_logs
      where item.id = matched_logs.plan_item_id
    `,
    [vehicleId, userId]
  );

  await client.query(
    `
      with latest_vehicle_logs as (
        select distinct on (plan.vehicle_id)
          plan.vehicle_id,
          sl.service_date,
          sl.mileage_km
        from vehicle_maintenance_plans plan
        inner join vehicles v on v.id = plan.vehicle_id
        inner join service_logs sl on sl.vehicle_id = plan.vehicle_id
        where v.deleted = false
          and ($1::uuid is null or plan.vehicle_id = $1)
          and ($2::uuid is null or v.user_id = $2)
        order by plan.vehicle_id, sl.service_date desc, sl.created_at desc
      )
      update vehicle_maintenance_plan_items item
      set baseline_date = latest_vehicle_logs.service_date,
          baseline_mileage_km = latest_vehicle_logs.mileage_km,
          updated_at = now()
      from vehicle_maintenance_plans plan
      inner join latest_vehicle_logs on latest_vehicle_logs.vehicle_id = plan.vehicle_id
      where item.plan_id = plan.id
        and item.status = 'pending'
        and item.last_completed_at is null
        and item.last_completed_mileage_km is null
        and item.last_service_log_id is null
        and ($1::uuid is null or plan.vehicle_id = $1)
        and (
          item.baseline_date is distinct from latest_vehicle_logs.service_date
          or item.baseline_mileage_km is distinct from latest_vehicle_logs.mileage_km
        )
    `,
    [vehicleId, userId]
  );
}

export async function getVehicleMaintenancePlan(vehicle: VehicleRecord, userId?: string): Promise<VehicleMaintenancePlanView> {
  await syncVehiclePlanForVehicleCatalogChange(vehicle);

  let planResult = await pool.query<VehicleMaintenancePlanRecord>(
    "select * from vehicle_maintenance_plans where vehicle_id = $1 limit 1",
    [vehicle.id]
  );

  const availableTemplates = await findMatchingTemplatesForVehicle(vehicle);
  const missingPlanRequest = userId ? await getOpenMissingPlanRequest(vehicle.id, userId) : null;

  if (!planResult.rows[0] && availableTemplates.length === 1) {
    await assignTemplateToVehicle(vehicle, availableTemplates[0].id);
    planResult = await pool.query<VehicleMaintenancePlanRecord>(
      "select * from vehicle_maintenance_plans where vehicle_id = $1 limit 1",
      [vehicle.id]
    );
  }

  const plan = planResult.rows[0] ?? null;

  if (!plan) {
    return {
      vehicle,
      plan: null,
      items: [],
      availableTemplates,
      templateSync: {
        isStale: false,
        wasAutoReassigned: false,
        latestTemplateUpdatedAt: null,
        message: null
      },
      missingPlanRequest: missingPlanRequest ? {
        id: missingPlanRequest.id,
        status: missingPlanRequest.status,
        request_note: missingPlanRequest.request_note,
        created_at: missingPlanRequest.created_at.toISOString()
      } : null
    };
  }

  await resolveOpenMissingPlanRequestsForVehicle(vehicle.id);
  await syncPlanItemsWithHistoricalServiceLogs({ vehicleId: vehicle.id });

  let itemsResult = await pool.query<VehicleMaintenancePlanItemRecord>(
    `
      select *
      from vehicle_maintenance_plan_items
      where plan_id = $1
      order by procedure_category asc, sort_order asc, procedure_title asc
    `,
    [plan.id]
  );

  let effectivePlan = plan;
  let templateSync: VehicleMaintenancePlanView["templateSync"] = {
    isStale: false,
    wasAutoReassigned: false,
    latestTemplateUpdatedAt: null,
    message: null
  };

  if (plan.template_id) {
    const templateVersion = await getTemplateVersion(plan.template_id);

    if (!templateVersion) {
      templateSync = {
        isStale: true,
        wasAutoReassigned: false,
        latestTemplateUpdatedAt: null,
        message: "Попередній план обслуговування більше недоступний. Зверніться до адміністратора, щоб підготувати актуальний план для цього авто."
      };
    } else if (plan.source_template_updated_at.getTime() < templateVersion.last_changed_at.getTime()) {
      if (canAutoReassignPlan(itemsResult.rows)) {
        await assignTemplateToVehicle(vehicle, plan.template_id);
        planResult = await pool.query<VehicleMaintenancePlanRecord>(
          "select * from vehicle_maintenance_plans where vehicle_id = $1 limit 1",
          [vehicle.id]
        );
        effectivePlan = planResult.rows[0] ?? plan;
        itemsResult = await pool.query<VehicleMaintenancePlanItemRecord>(
          `
            select *
            from vehicle_maintenance_plan_items
            where plan_id = $1
            order by procedure_category asc, sort_order asc, procedure_title asc
          `,
          [effectivePlan.id]
        );
        templateSync = {
          isStale: false,
          wasAutoReassigned: true,
          latestTemplateUpdatedAt: templateVersion.last_changed_at.toISOString(),
          message: "План обслуговування було оновлено автоматично, бо по ньому ще не було зафіксовано виконаних робіт."
        };
      } else {
        templateSync = {
          isStale: true,
          wasAutoReassigned: false,
          latestTemplateUpdatedAt: templateVersion.last_changed_at.toISOString(),
          message: "Для цього авто зʼявилась новіша версія плану обслуговування. Поточні відмітки збережено, а оновлення можна виконати окремо через керування каталогом."
        };
      }
    }
  }

  return {
    vehicle,
    plan: effectivePlan,
    items: itemsResult.rows.map((item) => deriveItemState(item, vehicle.mileage_km)),
    availableTemplates,
    templateSync,
    missingPlanRequest: null
  };
}

export async function assignTemplateToVehicle(vehicle: VehicleRecord, templateId: string): Promise<VehicleMaintenancePlanRecord> {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const templateHeaderResult = await client.query<TemplateHeader>(
      `
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
          mst.notes_uk,
          count(msi.id)::int as item_count
        from maintenance_schedule_templates mst
        inner join vehicle_generations vg on vg.id = mst.generation_id
        inner join vehicle_models vm on vm.id = vg.model_id
        inner join vehicle_brands vb on vb.id = vm.brand_id
        left join vehicle_configurations vc on vc.id = mst.configuration_id
        left join maintenance_schedule_items msi on msi.template_id = mst.id and msi.deleted = false
        where mst.id = $1
          and mst.deleted = false
        group by mst.id, mst.name_uk, mst.generation_id, mst.configuration_id, vb.name, vm.name, vg.name, vc.id, vc.engine_label, vc.transmission_label, vc.drivetrain_label, vg.year_from, vg.year_to, mst.notes_uk
      `,
      [templateId]
    );

    const templateHeader = templateHeaderResult.rows[0];

    if (!templateHeader) {
      throw new Error("Maintenance template not found");
    }

    if (templateHeader.configuration_id && templateHeader.configuration_id !== vehicle.configuration_id) {
      throw new Error("MAINTENANCE_TEMPLATE_DOES_NOT_MATCH_VEHICLE");
    }

    if (!templateHeader.configuration_id && templateHeader.generation_id !== vehicle.generation_id) {
      throw new Error("MAINTENANCE_TEMPLATE_DOES_NOT_MATCH_VEHICLE");
    }

    const items = await getTemplateItems(templateId, client);
    const templateVersion = await getTemplateVersion(templateId, client);

    const deletedPlanResult = await client.query<VehicleMaintenancePlanRecord>(
      `
        delete from vehicle_maintenance_plans
        where vehicle_id = $1
        returning *
      `,
      [vehicle.id]
    );

    const planResult = await client.query<VehicleMaintenancePlanRecord>(
      `
        insert into vehicle_maintenance_plans (vehicle_id, template_id, template_name, source_template_updated_at)
        values ($1, $2, $3, $4)
        returning *
      `,
      [vehicle.id, templateHeader.id, templateHeader.name_uk, templateVersion?.last_changed_at ?? new Date()]
    );

    const plan = planResult.rows[0] ?? deletedPlanResult.rows[0];

    await resolveOpenMissingPlanRequestsForVehicle(vehicle.id, client);

    for (const [index, item] of items.entries()) {
      await client.query(
        `
          insert into vehicle_maintenance_plan_items (
            plan_id,
            procedure_id,
            procedure_title,
            procedure_category,
            interval_km,
            interval_months,
            notes_uk,
            sort_order,
            baseline_date,
            baseline_mileage_km,
            status
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        `,
        [
          plan.id,
          item.procedure_id,
          item.procedure_title,
          item.procedure_category,
          item.interval_km,
          item.interval_months,
          item.notes_uk,
          index + 1,
          plan.assigned_at.toISOString().slice(0, 10),
          vehicle.mileage_km
        ]
      );
    }

    await syncPlanItemsWithHistoricalServiceLogs({ vehicleId: vehicle.id, client });

    await client.query("commit");
    return plan;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createMissingMaintenancePlanRequest(input: {
  userId: string;
  vehicle: VehicleRecord;
  requestNote?: string | null;
}): Promise<MaintenancePlanRequestRecord> {
  const existingResult = await pool.query<MaintenancePlanRequestRecord>(
    `
      select *
      from maintenance_plan_requests
      where vehicle_id = $1
        and user_id = $2
        and status = 'open'
      order by created_at desc
      limit 1
    `,
    [input.vehicle.id, input.userId]
  );

  const existing = existingResult.rows[0];

  if (existing) {
    return existing;
  }

  const result = await pool.query<MaintenancePlanRequestRecord>(
    `
      insert into maintenance_plan_requests (user_id, vehicle_id, request_note)
      values ($1, $2, $3)
      returning *
    `,
    [input.userId, input.vehicle.id, input.requestNote ?? null]
  );

  return result.rows[0];
}

export async function updatePlanItemStatus(input: {
  vehicleId: string;
  planItemId: string;
  status: "pending" | "skipped";
}): Promise<VehicleMaintenancePlanItemRecord | null> {
  const result = await pool.query<VehicleMaintenancePlanItemRecord>(
    `
      update vehicle_maintenance_plan_items item
      set status = $3,
          updated_at = now()
      from vehicle_maintenance_plans plan
      where item.id = $2
        and item.plan_id = plan.id
        and plan.vehicle_id = $1
      returning item.*
    `,
    [input.vehicleId, input.planItemId, input.status]
  );

  return result.rows[0] ?? null;
}

export async function syncPlanItemsWithServiceLog(client: PoolClient, input: {
  vehicleId: string;
  serviceLogId: string;
  serviceDate: string;
  mileageKm: number;
  procedureIds: string[];
}): Promise<void> {
  if (input.procedureIds.length === 0) {
    return;
  }

  await client.query(
    `
      update vehicle_maintenance_plan_items item
      set status = 'done',
          last_completed_at = $4,
          last_completed_mileage_km = $5,
          last_service_log_id = $3,
          updated_at = now()
      from vehicle_maintenance_plans plan
      where item.plan_id = plan.id
        and plan.vehicle_id = $1
        and item.procedure_id = any($2::uuid[])
    `,
    [input.vehicleId, input.procedureIds, input.serviceLogId, input.serviceDate, input.mileageKm]
  );
}