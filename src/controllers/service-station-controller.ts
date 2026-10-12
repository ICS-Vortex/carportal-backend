import { listActiveServiceStations } from "../repositories/service-station-repository";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

export async function listServiceStations(context: HandlerContext): Promise<void> {
  const items = await listActiveServiceStations();
  sendJson(context.res, 200, { items });
}
