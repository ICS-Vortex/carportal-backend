import { deleteManagedImageForCms, uploadServiceStationImageForCms } from "../controllers/cms-upload-controller";
import { API_ROUTES } from "../constants/routes";
import type { RouteDefinition } from "../utils/http";

export const cmsUploadRoutes: RouteDefinition[] = [
  { method: "POST", path: API_ROUTES.cms.serviceStationImages, handler: uploadServiceStationImageForCms, cmsUpload: true },
  { method: "POST", path: API_ROUTES.cms.deleteManagedImage, handler: deleteManagedImageForCms, cmsUpload: true }
];
