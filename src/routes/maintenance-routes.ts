import { API_ROUTES } from "../constants/routes";
import {
  assignMaintenanceTemplate,
  completeMaintenanceItem,
  getMaintenancePlan,
  requestMissingMaintenancePlan,
  updateMaintenanceItemStatus
} from "../controllers/maintenance-controller";
import type { RouteDefinition } from "../utils/http";

export const maintenanceRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.vehicles.maintenancePlan, handler: getMaintenancePlan, auth: true },
  { method: "POST", path: API_ROUTES.vehicles.maintenancePlanRequest, handler: requestMissingMaintenancePlan, auth: true, csrf: true },
  { method: "POST", path: API_ROUTES.vehicles.maintenancePlanAssignTemplate, handler: assignMaintenanceTemplate, auth: true, csrf: true },
  { method: "PATCH", path: API_ROUTES.vehicles.maintenancePlanItemStatus, handler: updateMaintenanceItemStatus, auth: true, csrf: true },
  { method: "POST", path: API_ROUTES.vehicles.maintenancePlanItemComplete, handler: completeMaintenanceItem, auth: true, csrf: true }
];