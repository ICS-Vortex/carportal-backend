import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { createServiceLog, deleteServiceLog, listServiceLogsByVehicle } from "../repositories/service-log-repository";
import { findServiceStationById } from "../repositories/service-station-repository";
import { findVehicleByIdForUser } from "../repositories/vehicle-repository";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const serviceLogSchema = z.object({
  serviceDate: z.string().date(),
  serviceTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  recordKind: z.enum(["visit", "appointment"]).optional().default("visit"),
  mileageKm: z.number().int().min(0).optional(),
  serviceStation: z.string().max(160).optional().nullable(),
  serviceStationId: z.string().uuid().optional().nullable(),
  notesUk: z.string().max(2000).optional().nullable(),
  items: z.array(
    z.object({
      procedureId: z.string().uuid(),
      notesUk: z.string().max(400).optional().nullable()
    })
  ).min(1)
});

export async function listServiceLogs(context: HandlerContext): Promise<void> {
  const logs = await listServiceLogsByVehicle(context.params.vehicleId, context.user!.userId);
  sendJson(context.res, 200, { items: logs });
}

export async function createServiceLogHandler(context: HandlerContext): Promise<void> {
  const input = serviceLogSchema.parse(context.body);
  const recordKind = input.recordKind ?? "visit";

  if (recordKind === "appointment" && !input.serviceTime) {
    sendJson(context.res, 400, { code: "missing_service_time", message: "Для запису на СТО оберіть час візиту." });
    return;
  }

  if (recordKind === "appointment" && !input.serviceStationId) {
    sendJson(context.res, 400, { code: "missing_service_station", message: "Для запису на СТО спочатку оберіть станцію." });
    return;
  }

  const vehicle = await findVehicleByIdForUser(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  const mileageKm = input.mileageKm ?? vehicle.mileage_km;

  let serviceStationId = input.serviceStationId ?? null;
  let serviceStationText = input.serviceStation
    ? sanitizeHtml(input.serviceStation, { allowedTags: [], allowedAttributes: {} })
    : null;

  if (serviceStationId) {
    const station = await findServiceStationById(serviceStationId);

    if (!station) {
      sendJson(context.res, 400, { code: "invalid_service_station", message: "Обране СТО недоступне або не існує." });
      return;
    }

    serviceStationText = station.name_uk;
  }

  const result = await createServiceLog({
    vehicleId: context.params.vehicleId,
    serviceDate: input.serviceDate,
    serviceTime: input.serviceTime ?? null,
    recordKind,
    mileageKm,
    serviceStation: serviceStationText,
    serviceStationId,
    notesUk: input.notesUk ? sanitizeHtml(input.notesUk, { allowedTags: [], allowedAttributes: {} }) : null,
    items: input.items.map((item) => ({
      procedureId: item.procedureId,
      notesUk: item.notesUk ? sanitizeHtml(item.notesUk, { allowedTags: [], allowedAttributes: {} }) : null
    }))
  });

  if ("code" in result) {
    sendJson(context.res, 400, { code: result.code, message: result.message });
    return;
  }

  sendJson(context.res, 201, { item: result });
}

export async function deleteServiceLogHandler(context: HandlerContext): Promise<void> {
  const serviceLog = await deleteServiceLog({
    vehicleId: context.params.vehicleId,
    serviceLogId: context.params.serviceLogId,
    userId: context.user!.userId
  });

  if (!serviceLog) {
    sendJson(context.res, 404, { code: "service_log_not_found", message: "Сервісний запис не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item: serviceLog });
}
