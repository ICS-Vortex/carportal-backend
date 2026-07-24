import { API_ROUTES } from "../constants/routes";
import { getLandingContent } from "../controllers/public-controller";
import type { RouteDefinition } from "../utils/http";

export const publicRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.public.landing, handler: getLandingContent }
];