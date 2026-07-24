import { z } from "zod";

import { createServiceLog } from "../repositories/service-log-repository";
import { createMissingMaintenancePlanRequest, getVehicleMaintenancePlan, updatePlanItemStatus, assignTemplateToVehicle } from "../repositories/maintenance-repository";
import { findVehicleByIdForUser } from "../repositories/vehicle-repository";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const assignTemplateSchema = z.object({
  templateId: z.string().uuid()
});

const planStatusSchema = z.object({
  status: z.enum(["pending", "skipped"])
});

const completePlanItemSchema = z.object({
  serviceDate: z.string().date(),
  mileageKm: z.number().int().min(0),
  serviceStation: z.string().max(160).optional().nullable(),
  notesUk: z.string().max(2000).optional().nullable()
});

const missingPlanRequestSchema = z.object({
  noteUk: z.string().max(800).optional().nullable()
});

export async function getMaintenancePlan(context: HandlerContext): Promise<void> {
  const vehicle = await findVehicleByIdForUser(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  const payload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);
  sendJson(context.res, 200, payload);
}

export async function assignMaintenanceTemplate(context: HandlerContext): Promise<void> {
  const vehicle = await findVehicleByIdForUser(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  const input = assignTemplateSchema.parse(context.body);
  await assignTemplateToVehicle(vehicle, input.templateId);
  const payload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);
  sendJson(context.res, 200, payload);
}

export async function updateMaintenanceItemStatus(context: HandlerContext): Promise<void> {
  const vehicle = await findVehicleByIdForUser(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  const input = planStatusSchema.parse(context.body);
  const item = await updatePlanItemStatus({
    vehicleId: vehicle.id,
    planItemId: context.params.planItemId,
    status: input.status
  });

  if (!item) {
    sendJson(context.res, 404, { code: "maintenance_item_not_found", message: "Пункт регламенту не знайдено." });
    return;
  }

  const payload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);
  sendJson(context.res, 200, payload);
}

export async function requestMissingMaintenancePlan(context: HandlerContext): Promise<void> {
  const vehicle = await findVehicleByIdForUser(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  const currentPayload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);

  if (currentPayload.plan) {
    sendJson(context.res, 409, { code: "maintenance_plan_already_exists", message: "Для цього авто вже є активний план обслуговування." });
    return;
  }

  const input = missingPlanRequestSchema.parse(context.body ?? {});
  await createMissingMaintenancePlanRequest({
    userId: context.user!.userId,
    vehicle,
    requestNote: input.noteUk ?? null
  });

  const nextPayload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);
  sendJson(context.res, 201, nextPayload);
}

export async function completeMaintenanceItem(context: HandlerContext): Promise<void> {
  const vehicle = await findVehicleByIdForUser(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  const payload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);
  const item = payload.items.find((entry) => entry.id === context.params.planItemId);

  if (!item || !item.procedure_id) {
    sendJson(context.res, 404, { code: "maintenance_item_not_found", message: "Пункт регламенту не знайдено." });
    return;
  }

  const input = completePlanItemSchema.parse(context.body);

  await createServiceLog({
    vehicleId: vehicle.id,
    serviceDate: input.serviceDate,
    mileageKm: input.mileageKm,
    serviceStation: input.serviceStation ?? null,
    notesUk: input.notesUk ?? null,
    items: [{ procedureId: item.procedure_id }]
  });

  const nextPayload = await getVehicleMaintenancePlan(vehicle, context.user!.userId);
  sendJson(context.res, 201, nextPayload);
}