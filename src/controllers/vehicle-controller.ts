import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { env } from "../config/env";
import { findVehicleConfigurationById, listVehicleCatalog } from "../repositories/catalog-repository";
import { syncVehiclePlanForVehicleCatalogChange } from "../repositories/maintenance-repository";
import { createVehicle, listVehiclesByUser, softDeleteVehicle, updateVehicleDetails, updateVehicleMileage } from "../repositories/vehicle-repository";
import { saveVehicleImageDataUrl } from "../services/vehicle-image-storage";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const vehicleSchema = z.object({
  configurationId: z.string().uuid(),
  year: z.number().int().min(1980).max(2100),
  vin: z.string().min(11).max(17).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  mileageKm: z.number().int().min(0).max(2_000_000)
});

const mileageSchema = z.object({
  mileageKm: z.number().int().min(0).max(2_000_000)
});

const vehicleImageUploadSchema = z.object({
  dataUrl: z.string().min(32)
});

function normalizeVehicleImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  return imageUrl.startsWith(`${env.API_ORIGIN}/uploads/vehicles/`) ? imageUrl : null;
}

async function validateVehicleConfiguration(configurationId: string, year: number): Promise<{
  valid: boolean;
  generationId?: string;
  message?: string;
}> {
  const configuration = await findVehicleConfigurationById(configurationId);

  if (!configuration) {
    return { valid: false, message: "Конфігурацію автомобіля не знайдено у довіднику." };
  }

  if (year < configuration.year_from || year > configuration.year_to) {
    return {
      valid: false,
      message: `Рік випуску має бути в межах ${configuration.year_from}-${configuration.year_to} для вибраної конфігурації.`
    };
  }

  return { valid: true, generationId: configuration.generation_id };
}

export async function listVehicleCatalogHandler(context: HandlerContext): Promise<void> {
  const catalog = await listVehicleCatalog();
  sendJson(context.res, 200, catalog);
}

export async function listVehicles(context: HandlerContext): Promise<void> {
  const vehicles = await listVehiclesByUser(context.user!.userId);
  sendJson(context.res, 200, { items: vehicles });
}

export async function createVehicleHandler(context: HandlerContext): Promise<void> {
  const input = vehicleSchema.parse(context.body);
  const validation = await validateVehicleConfiguration(input.configurationId, input.year);

  if (!validation.valid) {
    sendJson(context.res, 422, { code: "vehicle_configuration_invalid", message: validation.message });
    return;
  }

  const vehicle = await createVehicle({
    userId: context.user!.userId,
    generationId: validation.generationId!,
    configurationId: input.configurationId,
    year: input.year,
    vin: input.vin ? input.vin.toUpperCase() : null,
    licensePlate: input.licensePlate ? sanitizeHtml(input.licensePlate, { allowedTags: [], allowedAttributes: {} }) : null,
    imageUrl: normalizeVehicleImageUrl(input.imageUrl),
    mileageKm: input.mileageKm
  });

  await syncVehiclePlanForVehicleCatalogChange(vehicle);

  sendJson(context.res, 201, { item: vehicle });
}

export async function updateVehicleHandler(context: HandlerContext): Promise<void> {
  const input = vehicleSchema.parse(context.body);
  const validation = await validateVehicleConfiguration(input.configurationId, input.year);

  if (!validation.valid) {
    sendJson(context.res, 422, { code: "vehicle_configuration_invalid", message: validation.message });
    return;
  }

  const vehicle = await updateVehicleDetails({
    vehicleId: context.params.vehicleId,
    userId: context.user!.userId,
    generationId: validation.generationId!,
    configurationId: input.configurationId,
    year: input.year,
    vin: input.vin ? input.vin.toUpperCase() : null,
    licensePlate: input.licensePlate ? sanitizeHtml(input.licensePlate, { allowedTags: [], allowedAttributes: {} }) : null,
    imageUrl: normalizeVehicleImageUrl(input.imageUrl),
    mileageKm: input.mileageKm
  });

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  await syncVehiclePlanForVehicleCatalogChange(vehicle);

  sendJson(context.res, 200, { item: vehicle });
}

export async function uploadVehicleImageHandler(context: HandlerContext): Promise<void> {
  const input = vehicleImageUploadSchema.parse(context.body);

  try {
    const imageUrl = await saveVehicleImageDataUrl(input.dataUrl);
    sendJson(context.res, 201, { url: imageUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "UNSUPPORTED_IMAGE_TYPE") {
      sendJson(context.res, 422, { code: "unsupported_image_type", message: "Підтримуються лише JPG, PNG та WEBP." });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_IMAGE_SIZE") {
      sendJson(context.res, 422, { code: "invalid_image_size", message: "Файл завеликий. Максимум 5 МБ." });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_IMAGE_DATA_URL") {
      sendJson(context.res, 422, { code: "invalid_image_data_url", message: "Некоректний формат файлу." });
      return;
    }

    throw error;
  }
}

export async function updateVehicleMileageHandler(context: HandlerContext): Promise<void> {
  const input = mileageSchema.parse(context.body);
  const vehicle = await updateVehicleMileage(context.params.vehicleId, context.user!.userId, input.mileageKm);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item: vehicle });
}

export async function deleteVehicleHandler(context: HandlerContext): Promise<void> {
  const vehicle = await softDeleteVehicle(context.params.vehicleId, context.user!.userId);

  if (!vehicle) {
    sendJson(context.res, 404, { code: "vehicle_not_found", message: "Автомобіль не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item: vehicle });
}
