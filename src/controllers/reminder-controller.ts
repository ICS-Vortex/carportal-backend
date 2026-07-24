import { listProcedures, listScheduleTemplates } from "../repositories/catalog-repository";
import { getUpcomingReminders } from "../services/reminder-service";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

export async function listCatalog(context: HandlerContext): Promise<void> {
  const [procedures, templates] = await Promise.all([listProcedures(), listScheduleTemplates()]);
  sendJson(context.res, 200, { procedures, templates });
}

export async function listReminders(context: HandlerContext): Promise<void> {
  const reminders = await getUpcomingReminders(context.user!.userId);
  sendJson(context.res, 200, { items: reminders });
}
