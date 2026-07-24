import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import {
  createProcedure,
  createScheduleTemplate,
  createScheduleTemplateItem,
  deleteProcedure,
  deleteScheduleTemplate,
  deleteScheduleTemplateItem,
  getAdminOverview as getAdminOverviewData,
  resolveMissingPlanRequest,
  updateProcedure,
  updateScheduleTemplate,
  updateScheduleTemplateItem
} from "../repositories/admin-repository";
import {
  listProcedures,
  listScheduleTemplateHeaders,
  listScheduleTemplates,
  listVehicleCatalog,
  findVehicleConfigurationById
} from "../repositories/catalog-repository";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const procedureSchema = z.object({
  code: z.string().min(2).max(80),
  titleUk: z.string().min(2).max(180),
  descriptionUk: z.string().max(1200).optional().nullable(),
  defaultIntervalKm: z.number().int().positive().optional().nullable(),
  defaultIntervalMonths: z.number().int().positive().optional().nullable(),
  category: z.string().min(2).max(80)
});

const templateSchema = z.object({
  nameUk: z.string().min(2).max(180),
  configurationId: z.string().uuid(),
  notesUk: z.string().max(1200).optional().nullable()
});

const templateItemSchema = z.object({
  templateId: z.string().uuid(),
  procedureId: z.string().uuid(),
  intervalKm: z.number().int().positive().optional().nullable(),
  intervalMonths: z.number().int().positive().optional().nullable(),
  notesUk: z.string().max(1200).optional().nullable()
});

function isDatabaseError(error: unknown): error is { code?: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function sanitizeProcedureInput(input: z.infer<typeof procedureSchema>) {
  return {
    code: sanitizeHtml(input.code, { allowedTags: [], allowedAttributes: {} }).toLowerCase(),
    titleUk: sanitizeHtml(input.titleUk, { allowedTags: [], allowedAttributes: {} }),
    descriptionUk: plainText(input.descriptionUk),
    defaultIntervalKm: input.defaultIntervalKm ?? null,
    defaultIntervalMonths: input.defaultIntervalMonths ?? null,
    category: sanitizeHtml(input.category, { allowedTags: [], allowedAttributes: {} })
  };
}

function sanitizeTemplateInput(input: z.infer<typeof templateSchema>) {
  return {
    nameUk: sanitizeHtml(input.nameUk, { allowedTags: [], allowedAttributes: {} }),
    configurationId: input.configurationId,
    notesUk: plainText(input.notesUk)
  };
}

function sanitizeTemplateItemInput(input: z.infer<typeof templateItemSchema>) {
  return {
    templateId: input.templateId,
    procedureId: input.procedureId,
    intervalKm: input.intervalKm ?? null,
    intervalMonths: input.intervalMonths ?? null,
    notesUk: plainText(input.notesUk)
  };
}

function plainText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

export async function getAdminCatalog(context: HandlerContext): Promise<void> {
  const [procedures, templates, templateHeaders, vehicleCatalog] = await Promise.all([
    listProcedures(),
    listScheduleTemplates(),
    listScheduleTemplateHeaders(),
    listVehicleCatalog()
  ]);

  sendJson(context.res, 200, { procedures, templates, templateHeaders, vehicleCatalog });
}

export async function getAdminOverview(context: HandlerContext): Promise<void> {
  const overview = await getAdminOverviewData();
  sendJson(context.res, 200, overview);
}

export async function resolveMissingPlanRequestHandler(context: HandlerContext): Promise<void> {
  const item = await resolveMissingPlanRequest(context.params.requestId);

  if (!item) {
    sendJson(context.res, 404, { code: "missing_plan_request_not_found", message: "Запит не знайдено або його вже закрито." });
    return;
  }

  sendJson(context.res, 200, { item });
}

export async function createProcedureHandler(context: HandlerContext): Promise<void> {
  const input = procedureSchema.parse(context.body);
  const item = await createProcedure(sanitizeProcedureInput(input));

  sendJson(context.res, 201, { item });
}

export async function updateProcedureHandler(context: HandlerContext): Promise<void> {
  const input = procedureSchema.parse(context.body);
  const item = await updateProcedure(context.params.procedureId, sanitizeProcedureInput(input));

  if (!item) {
    sendJson(context.res, 404, { code: "procedure_not_found", message: "Процедуру не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item });
}

export async function deleteProcedureHandler(context: HandlerContext): Promise<void> {
  try {
    const item = await deleteProcedure(context.params.procedureId);

    if (!item) {
      sendJson(context.res, 404, { code: "procedure_not_found", message: "Процедуру не знайдено." });
      return;
    }

    sendJson(context.res, 200, { item });
  } catch (error) {
    if (isDatabaseError(error) && error.code === "23503") {
      sendJson(context.res, 409, { code: "procedure_in_use", message: "Процедуру вже використано в сервісних записах, тому її не можна видалити." });
      return;
    }

    throw error;
  }
}

export async function createTemplateHandler(context: HandlerContext): Promise<void> {
  const input = templateSchema.parse(context.body);
  const configuration = await findVehicleConfigurationById(input.configurationId);

  if (!configuration) {
    sendJson(context.res, 422, { code: "vehicle_configuration_not_found", message: "Не вдалося знайти таку конфігурацію авто в каталозі." });
    return;
  }

  try {
    const item = await createScheduleTemplate({
      ...sanitizeTemplateInput(input),
      generationId: configuration.generation_id
    });

    sendJson(context.res, 201, { item });
  } catch (error) {
    if (isDatabaseError(error) && error.code === "23505") {
      sendJson(context.res, 409, { code: "maintenance_template_conflict", message: "Для цієї конфігурації вже існує активний план обслуговування." });
      return;
    }

    throw error;
  }
}

export async function updateTemplateHandler(context: HandlerContext): Promise<void> {
  const input = templateSchema.parse(context.body);
  const configuration = await findVehicleConfigurationById(input.configurationId);

  if (!configuration) {
    sendJson(context.res, 422, { code: "vehicle_configuration_not_found", message: "Не вдалося знайти таку конфігурацію авто в каталозі." });
    return;
  }

  try {
    const item = await updateScheduleTemplate(context.params.templateId, {
      ...sanitizeTemplateInput(input),
      generationId: configuration.generation_id
    });

    if (!item) {
      sendJson(context.res, 404, { code: "maintenance_template_not_found", message: "Шаблон не знайдено." });
      return;
    }

    sendJson(context.res, 200, { item });
  } catch (error) {
    if (isDatabaseError(error) && error.code === "23505") {
      sendJson(context.res, 409, { code: "maintenance_template_conflict", message: "Для цієї конфігурації вже існує активний план обслуговування." });
      return;
    }

    throw error;
  }
}

export async function deleteTemplateHandler(context: HandlerContext): Promise<void> {
  const item = await deleteScheduleTemplate(context.params.templateId);

  if (!item) {
    sendJson(context.res, 404, { code: "maintenance_template_not_found", message: "Шаблон не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item });
}

export async function createTemplateItemHandler(context: HandlerContext): Promise<void> {
  const input = templateItemSchema.parse(context.body);
  const item = await createScheduleTemplateItem(sanitizeTemplateItemInput(input));

  sendJson(context.res, 201, { item });
}

export async function updateTemplateItemHandler(context: HandlerContext): Promise<void> {
  const input = templateItemSchema.parse(context.body);
  const item = await updateScheduleTemplateItem(context.params.scheduleItemId, sanitizeTemplateItemInput(input));

  if (!item) {
    sendJson(context.res, 404, { code: "maintenance_template_item_not_found", message: "Пункт шаблону не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item });
}

export async function deleteTemplateItemHandler(context: HandlerContext): Promise<void> {
  const item = await deleteScheduleTemplateItem(context.params.scheduleItemId);

  if (!item) {
    sendJson(context.res, 404, { code: "maintenance_template_item_not_found", message: "Пункт шаблону не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item });
}
