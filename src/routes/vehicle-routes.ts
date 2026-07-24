import { API_ROUTES } from "../constants/routes";
import { createVehicleHandler, deleteVehicleHandler, listVehicleCatalogHandler, listVehicles, updateVehicleHandler, updateVehicleMileageHandler, uploadVehicleImageHandler } from "../controllers/vehicle-controller";
import type { RouteDefinition } from "../utils/http";

export const vehicleRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.vehicles.catalog, handler: listVehicleCatalogHandler, auth: true },
  { method: "GET", path: API_ROUTES.vehicles.list, handler: listVehicles, auth: true },
  { method: "POST", path: API_ROUTES.vehicles.list, handler: createVehicleHandler, auth: true, csrf: true },
  { method: "PATCH", path: API_ROUTES.vehicles.detail, handler: updateVehicleHandler, auth: true, csrf: true },
  { method: "DELETE", path: API_ROUTES.vehicles.detail, handler: deleteVehicleHandler, auth: true, csrf: true },
  { method: "PATCH", path: API_ROUTES.vehicles.mileage, handler: updateVehicleMileageHandler, auth: true, csrf: true },
  { method: "POST", path: API_ROUTES.vehicles.imageUpload, handler: uploadVehicleImageHandler, auth: true, csrf: true }
];
