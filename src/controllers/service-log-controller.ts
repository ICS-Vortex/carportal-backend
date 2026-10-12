import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { createServiceLog, deleteServiceLog, listServiceLogsByVehicle } from "../repositories/service-log-repository";
import { findServiceStationById } from "../repositories/service-station-repository";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const serviceLogSchema = z.object({
  serviceDate: z.string().date(),
  mileageKm: z.number().int().min(0),
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

  const serviceLog = await createServiceLog({
    vehicleId: context.params.vehicleId,
    serviceDate: input.serviceDate,
    mileageKm: input.mileageKm,
    serviceStation: serviceStationText,
    serviceStationId,
    notesUk: input.notesUk ? sanitizeHtml(input.notesUk, { allowedTags: [], allowedAttributes: {} }) : null,
    items: input.items.map((item) => ({
      procedureId: item.procedureId,
      notesUk: item.notesUk ? sanitizeHtml(item.notesUk, { allowedTags: [], allowedAttributes: {} }) : null
    }))
  });

  sendJson(context.res, 201, { item: serviceLog });
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
