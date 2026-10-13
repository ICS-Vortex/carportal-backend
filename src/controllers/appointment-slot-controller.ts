import { z } from "zod";

import { listAppointmentSlots } from "../services/appointment-slot-service";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";
import { compareDateStrings, kyivTodayDateString } from "../utils/kyiv-time";

const querySchema = z.object({
  date: z.string().date()
});

export async function listServiceStationAppointmentSlots(context: HandlerContext): Promise<void> {
  const query = querySchema.parse(context.query ?? {});
  const today = kyivTodayDateString();

  if (compareDateStrings(query.date, today) < 0) {
    sendJson(context.res, 200, { items: [] });
    return;
  }

  const items = await listAppointmentSlots(context.params.stationId, query.date);
  sendJson(context.res, 200, { items });
}
