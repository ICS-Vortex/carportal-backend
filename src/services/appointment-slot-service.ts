import type { PoolClient } from "pg";

import { pool } from "../db/pool";
import {
  compareDateStrings,
  compareTimeStrings,
  formatMinutesAsTime,
  kyivNowTimeString,
  kyivTodayDateString,
  parseTimeToMinutes
} from "../utils/kyiv-time";

export type StationSchedulingConfig = {
  id: string;
  appointment_slot_minutes: number;
  appointment_day_start: string;
  appointment_day_end: string;
  appointment_slot_capacity: number;
};

export type AppointmentSlot = {
  time: string;
  available: boolean;
  booked_count: number;
  capacity: number;
};

function normalizePgTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export async function getStationSchedulingConfig(stationId: string): Promise<StationSchedulingConfig | null> {
  const result = await pool.query<StationSchedulingConfig>(
    `
      select
        id,
        appointment_slot_minutes,
        appointment_day_start::text as appointment_day_start,
        appointment_day_end::text as appointment_day_end,
        appointment_slot_capacity
      from service_stations
      where id = $1 and is_active = true
      limit 1
    `,
    [stationId]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    ...row,
    appointment_day_start: normalizePgTime(row.appointment_day_start),
    appointment_day_end: normalizePgTime(row.appointment_day_end)
  };
}

function buildSlotTimes(config: StationSchedulingConfig): string[] {
  const startMinutes = parseTimeToMinutes(normalizePgTime(config.appointment_day_start));
  const endMinutes = parseTimeToMinutes(normalizePgTime(config.appointment_day_end));
  const step = Math.max(config.appointment_slot_minutes, 15);
  const slots: string[] = [];

  for (let cursor = startMinutes; cursor + step <= endMinutes; cursor += step) {
    slots.push(formatMinutesAsTime(cursor));
  }

  return slots;
}

async function loadBookedCounts(stationId: string, serviceDate: string): Promise<Map<string, number>> {
  const result = await pool.query<{ service_time: string; booked_count: number }>(
    `
      select service_time::text as service_time, count(*)::int as booked_count
      from service_logs
      where service_station_id = $1
        and service_date = $2::date
        and record_kind = 'appointment'
      group by service_time
    `,
    [stationId, serviceDate]
  );

  const counts = new Map<string, number>();

  for (const row of result.rows) {
    counts.set(normalizePgTime(row.service_time), row.booked_count);
  }

  return counts;
}

type ScheduleBlockRow = {
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
};

async function loadScheduleBlocks(stationId: string, serviceDate: string): Promise<ScheduleBlockRow[]> {
  const result = await pool.query<ScheduleBlockRow>(
    `
      select start_date::text as start_date, end_date::text as end_date,
             start_time::text as start_time, end_time::text as end_time
      from service_station_schedule_blocks
      where (station_id is null or station_id = $1)
        and start_date <= $2::date
        and end_date >= $2::date
    `,
    [stationId, serviceDate]
  );

  return result.rows;
}

function isWholeDayBlocked(blocks: ScheduleBlockRow[]): boolean {
  return blocks.some((block) => !block.start_time && !block.end_time);
}

function isTimeBlocked(blocks: ScheduleBlockRow[], time: string): boolean {
  const slotMinutes = parseTimeToMinutes(time);

  for (const block of blocks) {
    if (!block.start_time || !block.end_time) {
      if (!block.start_time && !block.end_time) {
        return true;
      }

      continue;
    }

    const start = parseTimeToMinutes(normalizePgTime(block.start_time));
    const end = parseTimeToMinutes(normalizePgTime(block.end_time));

    if (slotMinutes >= start && slotMinutes < end) {
      return true;
    }
  }

  return false;
}

export async function listAppointmentSlots(stationId: string, serviceDate: string): Promise<AppointmentSlot[]> {
  const config = await getStationSchedulingConfig(stationId);

  if (!config) {
    return [];
  }

  const today = kyivTodayDateString();

  if (compareDateStrings(serviceDate, today) < 0) {
    return [];
  }

  const blocks = await loadScheduleBlocks(stationId, serviceDate);

  if (isWholeDayBlocked(blocks)) {
    return [];
  }

  const bookedCounts = await loadBookedCounts(stationId, serviceDate);
  const nowTime = kyivNowTimeString();
  const isToday = serviceDate === today;

  return buildSlotTimes(config).map((time) => {
    const bookedCount = bookedCounts.get(time) ?? 0;
    const pastSlot = isToday && compareTimeStrings(time, nowTime) <= 0;
    const blocked = isTimeBlocked(blocks, time);

    return {
      time,
      booked_count: bookedCount,
      capacity: config.appointment_slot_capacity,
      available: !pastSlot && !blocked && bookedCount < config.appointment_slot_capacity
    };
  });
}

export async function assertAppointmentSlotAvailable(
  client: PoolClient,
  input: {
    stationId: string;
    serviceDate: string;
    serviceTime: string;
  }
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const config = await getStationSchedulingConfig(input.stationId);

  if (!config) {
    return { ok: false, code: "invalid_service_station", message: "Обране СТО недоступне або не існує." };
  }

  const today = kyivTodayDateString();

  if (compareDateStrings(input.serviceDate, today) < 0) {
    return { ok: false, code: "past_service_date", message: "Неможливо обрати дату в минулому." };
  }

  const slots = buildSlotTimes(config);
  const normalizedTime = normalizePgTime(input.serviceTime);

  if (!slots.includes(normalizedTime)) {
    return { ok: false, code: "invalid_service_time", message: "Обраний час не входить у робочий графік СТО." };
  }

  if (input.serviceDate === today && compareTimeStrings(normalizedTime, kyivNowTimeString()) <= 0) {
    return { ok: false, code: "past_service_time", message: "Обраний час уже минув. Оберіть пізніший слот." };
  }

  const blocks = await loadScheduleBlocks(input.stationId, input.serviceDate);

  if (isWholeDayBlocked(blocks) || isTimeBlocked(blocks, normalizedTime)) {
    return { ok: false, code: "slot_blocked", message: "Обраний час закритий для запису." };
  }

  const countResult = await client.query<{ booked_count: number }>(
    `
      select count(*)::int as booked_count
      from service_logs
      where service_station_id = $1
        and service_date = $2::date
        and service_time = $3::time
        and record_kind = 'appointment'
      for update
    `,
    [input.stationId, input.serviceDate, normalizedTime]
  );

  const bookedCount = countResult.rows[0]?.booked_count ?? 0;

  if (bookedCount >= config.appointment_slot_capacity) {
    return { ok: false, code: "slot_unavailable", message: "Цей час уже зайнятий. Оберіть інший слот." };
  }

  return { ok: true };
}
