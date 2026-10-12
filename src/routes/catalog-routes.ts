import { API_ROUTES } from "../constants/routes";
import { listCatalog, listReminders } from "../controllers/reminder-controller";
import { listServiceStations } from "../controllers/service-station-controller";
import type { RouteDefinition } from "../utils/http";

export const catalogRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.catalog.list, handler: listCatalog, auth: true },
  { method: "GET", path: API_ROUTES.catalog.reminders, handler: listReminders, auth: true },
  { method: "GET", path: API_ROUTES.catalog.serviceStations, handler: listServiceStations, auth: true }
];
