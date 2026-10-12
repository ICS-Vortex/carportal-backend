import { pool } from "../db/pool";
import { syncPlanItemsWithHistoricalServiceLogs } from "../repositories/maintenance-repository";

type ReminderView = {
  vehicle_id: string;
  vehicle_name: string;
  procedure_id: string;
  procedure_title: string;
  due_date: string | null;
  due_mileage_km: number | null;
  current_mileage_km: number;
  status: string;
};

type ReminderCandidateRow = {
  user_id: string;
  vehicle_id: string;
  procedure_id: string;
  baseline_date: string | Date;
  baseline_mileage_km: number;
  last_completed_at: string | Date | null;
  last_completed_mileage_km: number | null;
  interval_km: number | null;
  interval_months: number | null;
  item_status: "pending" | "done" | "skipped";
  current_mileage_km: number;
};

type ReminderCandidate = {
  user_id: string;
  vehicle_id: string;
  procedure_id: string;
  due_date: string | null;
  due_mileage_km: number | null;
  status: "upcoming" | "due";
};

function normalizeDateOnly(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function parseDateOnly(value: string | Date): Date {
  return new Date(`${normalizeDateOnly(value)}T00:00:00.000Z`);
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

function addDays(value: string | Date, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

function getTodayDateOnly(): string {
  return formatDateOnly(new Date());
}

function buildReminderCandidate(row: ReminderCandidateRow): ReminderCandidate | null {
  if (row.item_status === "skipped") {
    return null;
  }

  const referenceDate = row.last_completed_at ?? row.baseline_date;
  const referenceMileageKm = row.last_completed_mileage_km ?? row.baseline_mileage_km;
  const dueDate = row.interval_months !== null ? addMonthsToDate(referenceDate, row.interval_months) : null;
  const dueMileageKm = row.interval_km !== null ? referenceMileageKm + row.interval_km : null;

  if (dueDate === null && dueMileageKm === null) {
    return null;
  }

  const today = getTodayDateOnly();
  const windowDate = addDays(today, 30);
  const dueByDate = dueDate !== null && dueDate <= today;
  const upcomingByDate = dueDate !== null && dueDate > today && dueDate <= windowDate;
  const dueByMileage = dueMileageKm !== null && row.current_mileage_km >= dueMileageKm;
  const upcomingByMileage = dueMileageKm !== null && row.current_mileage_km < dueMileageKm && (dueMileageKm - row.current_mileage_km) <= 1000;

  if (!dueByDate && !upcomingByDate && !dueByMileage && !upcomingByMileage) {
    return null;
  }

  return {
    user_id: row.user_id,
    vehicle_id: row.vehicle_id,
    procedure_id: row.procedure_id,
    due_date: dueDate,
    due_mileage_km: dueMileageKm,
    status: dueByDate || dueByMileage ? "due" : "upcoming"
  };
}

async function syncReminderSnapshots(userId?: string): Promise<void> {
  await syncPlanItemsWithHistoricalServiceLogs({ userId });

  const result = await pool.query<ReminderCandidateRow>(
    `
      select
        v.user_id,
        v.id as vehicle_id,
        item.procedure_id,
        item.baseline_date,
        item.baseline_mileage_km,
        item.last_completed_at,
        item.last_completed_mileage_km,
        item.interval_km,
        item.interval_months,
        item.status as item_status,
        v.mileage_km as current_mileage_km
      from vehicle_maintenance_plan_items item
      inner join vehicle_maintenance_plans plan on plan.id = item.plan_id
      inner join vehicles v on v.id = plan.vehicle_id
      inner join users u on u.id = v.user_id
      where v.deleted = false
        and u.deleted = false
        and item.procedure_id is not null
        and ($1::uuid is null or v.user_id = $1)
    `,
    [userId ?? null]
  );

  const candidates = result.rows.map(buildReminderCandidate).filter((item): item is ReminderCandidate => item !== null);
  const keys = candidates.map((item) => `${item.user_id}:${item.vehicle_id}:${item.procedure_id}`);
  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const candidate of candidates) {
      await client.query(
        `
          insert into reminders (
            id,
            user_id,
            vehicle_id,
            procedure_id,
            due_date,
            due_mileage_km,
            status,
            created_at,
            updated_at
          )
          values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
          on conflict (user_id, vehicle_id, procedure_id)
          do update set
            due_date = excluded.due_date,
            due_mileage_km = excluded.due_mileage_km,
            status = excluded.status,
            last_sent_at = case
              when reminders.due_date is distinct from excluded.due_date
                or reminders.due_mileage_km is distinct from excluded.due_mileage_km
              then null
              else reminders.last_sent_at
            end,
            updated_at = now()
        `,
        [candidate.user_id, candidate.vehicle_id, candidate.procedure_id, candidate.due_date, candidate.due_mileage_km, candidate.status]
      );
    }

    if (candidates.length === 0) {
      await client.query(
        `delete from reminders where ($1::uuid is null or user_id = $1)`,
        [userId ?? null]
      );
    } else {
      await client.query(
        `
          delete from reminders
          where ($1::uuid is null or user_id = $1)
            and concat(user_id::text, ':', vehicle_id::text, ':', procedure_id::text) <> all($2::text[])
        `,
        [userId ?? null, keys]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUpcomingReminders(userId: string): Promise<ReminderView[]> {
  await syncReminderSnapshots(userId);

  const result = await pool.query<ReminderView>(
    `
      select
        r.vehicle_id,
        concat(vb.name, ' ', vm.name, ' ', v.year) as vehicle_name,
        r.procedure_id,
        mp.title_uk as procedure_title,
        r.due_date,
        r.due_mileage_km,
        v.mileage_km as current_mileage_km,
        r.status
      from reminders r
      inner join vehicles v on v.id = r.vehicle_id
      inner join vehicle_generations vg on vg.id = v.generation_id
      inner join vehicle_models vm on vm.id = vg.model_id
      inner join vehicle_brands vb on vb.id = vm.brand_id
      inner join maintenance_procedures mp on mp.id = r.procedure_id
      where r.user_id = $1
        and v.deleted = false
      order by coalesce(r.due_date, current_date + interval '365 days') asc, r.due_mileage_km asc nulls last
    `,
    [userId]
  );

  return result.rows;
}

export async function markReminderSent(reminderId: string): Promise<void> {
  await pool.query(
    `
      update reminders
      set status = 'sent', last_sent_at = now(), updated_at = now()
      where id = $1
    `,
    [reminderId]
  );
}

export async function getDueReminderEmails(): Promise<
  Array<{
    reminder_id: string;
    email: string;
    full_name: string;
    vehicle_name: string;
    procedure_title: string;
    due_date: string | null;
  }>
> {
  await syncReminderSnapshots();

  const result = await pool.query<{
    reminder_id: string;
    email: string;
    full_name: string;
    vehicle_name: string;
    procedure_title: string;
    due_date: string | null;
  }>(`
    select
      r.id as reminder_id,
      u.email,
      u.full_name,
      concat(vb.name, ' ', vm.name, ' ', v.year) as vehicle_name,
      mp.title_uk as procedure_title,
      r.due_date
    from reminders r
    inner join users u on u.id = r.user_id
    inner join vehicles v on v.id = r.vehicle_id
    inner join vehicle_generations vg on vg.id = v.generation_id
    inner join vehicle_models vm on vm.id = vg.model_id
    inner join vehicle_brands vb on vb.id = vm.brand_id
    inner join maintenance_procedures mp on mp.id = r.procedure_id
    where r.notify_email = true
      and v.deleted = false
      and r.status in ('upcoming', 'due')
      and r.last_sent_at is null
      and r.due_date is not null
      and r.due_date <= current_date + make_interval(days => r.remind_days_before)
    order by r.due_date asc
  `);

  return result.rows;
}
