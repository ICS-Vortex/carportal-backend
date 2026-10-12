import { findServiceStationById } from "../repositories/service-station-repository";
import type { HandlerContext } from "./http";
import { sendJson } from "./http";

/** Resolves `stationId` query param; `null` when omitted. Returns `undefined` after sending 400. */
export async function resolveServiceStationIdFromQuery(context: HandlerContext): Promise<string | null | undefined> {
  const raw = context.query.stationId;

  if (raw === undefined || raw === "") {
    return null;
  }

  const station = await findServiceStationById(raw);

  if (!station) {
    sendJson(context.res, 400, {
      code: "invalid_service_station",
      message: "Обране СТО недоступне або не існує."
    });
    return undefined;
  }

  return raw;
}
