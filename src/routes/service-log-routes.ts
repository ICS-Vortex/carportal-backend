import { API_ROUTES } from "../constants/routes";
import { createServiceLogHandler, deleteServiceLogHandler, listServiceLogs } from "../controllers/service-log-controller";
import type { RouteDefinition } from "../utils/http";

export const serviceLogRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.vehicles.serviceLogs, handler: listServiceLogs, auth: true },
  { method: "POST", path: API_ROUTES.vehicles.serviceLogs, handler: createServiceLogHandler, auth: true, csrf: true },
  { method: "DELETE", path: API_ROUTES.vehicles.serviceLogDetail, handler: deleteServiceLogHandler, auth: true, csrf: true }
];
