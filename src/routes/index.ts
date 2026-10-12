import type { RouteDefinition } from "../utils/http";
import { authRoutes } from "./auth-routes";
import { catalogRoutes } from "./catalog-routes";
import { cmsUploadRoutes } from "./cms-upload-routes";
import { maintenanceRoutes } from "./maintenance-routes";
import { publicRoutes } from "./public-routes";
import { serviceLogRoutes } from "./service-log-routes";
import { vehicleRoutes } from "./vehicle-routes";

export const routes: RouteDefinition[] = [
  ...publicRoutes,
  ...authRoutes,
  ...vehicleRoutes,
  ...maintenanceRoutes,
  ...serviceLogRoutes,
  ...catalogRoutes,
  ...cmsUploadRoutes
];
