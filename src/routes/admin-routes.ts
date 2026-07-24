import { API_ROUTES } from "../constants/routes";
import {
  createProcedureHandler,
  createTemplateHandler,
  createTemplateItemHandler,
  deleteProcedureHandler,
  deleteTemplateHandler,
  deleteTemplateItemHandler,
  getAdminCatalog,
  getAdminOverview,
  resolveMissingPlanRequestHandler,
  updateProcedureHandler,
  updateTemplateHandler,
  updateTemplateItemHandler
} from "../controllers/admin-controller";
import { getAdminUsers, updateAdminUser } from "../controllers/admin-user-controller";
import type { RouteDefinition } from "../utils/http";

export const adminRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.admin.overview, handler: getAdminOverview, auth: true, admin: true },
  { method: "PATCH", path: API_ROUTES.admin.missingPlanRequestDetail, handler: resolveMissingPlanRequestHandler, auth: true, csrf: true, admin: true },
  { method: "GET", path: API_ROUTES.admin.users, handler: getAdminUsers, auth: true, admin: true },
  { method: "PATCH", path: API_ROUTES.admin.userDetail, handler: updateAdminUser, auth: true, csrf: true, admin: true },
  { method: "GET", path: API_ROUTES.admin.catalog, handler: getAdminCatalog, auth: true, admin: true },
  { method: "POST", path: API_ROUTES.admin.procedures, handler: createProcedureHandler, auth: true, csrf: true, admin: true },
  { method: "PATCH", path: API_ROUTES.admin.procedureDetail, handler: updateProcedureHandler, auth: true, csrf: true, admin: true },
  { method: "DELETE", path: API_ROUTES.admin.procedureDetail, handler: deleteProcedureHandler, auth: true, csrf: true, admin: true },
  { method: "POST", path: API_ROUTES.admin.templates, handler: createTemplateHandler, auth: true, csrf: true, admin: true },
  { method: "PATCH", path: API_ROUTES.admin.templateDetail, handler: updateTemplateHandler, auth: true, csrf: true, admin: true },
  { method: "DELETE", path: API_ROUTES.admin.templateDetail, handler: deleteTemplateHandler, auth: true, csrf: true, admin: true },
  { method: "POST", path: API_ROUTES.admin.templateItems, handler: createTemplateItemHandler, auth: true, csrf: true, admin: true },
  { method: "PATCH", path: API_ROUTES.admin.templateItemDetail, handler: updateTemplateItemHandler, auth: true, csrf: true, admin: true },
  { method: "DELETE", path: API_ROUTES.admin.templateItemDetail, handler: deleteTemplateItemHandler, auth: true, csrf: true, admin: true }
];
