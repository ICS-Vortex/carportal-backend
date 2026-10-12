export const APP_ROUTES = {
  auth: "/auth"
} as const;

export const API_ROUTES = {
  auth: {
    csrf: "/v1/auth/csrf",
    me: "/v1/auth/me",
    profile: "/v1/auth/profile",
    register: "/v1/auth/register",
    login: "/v1/auth/login",
    google: "/v1/auth/google",
    mobileRegister: "/v1/auth/mobile/register",
    mobileLogin: "/v1/auth/mobile/login",
    mobileGoogle: "/v1/auth/mobile/google",
    mobileRefresh: "/v1/auth/mobile/refresh",
    mobileLogout: "/v1/auth/mobile/logout",
    mobileSessions: "/v1/auth/mobile/sessions",
    mobileLogoutCurrent: "/v1/auth/mobile/logout-current",
    mobileLogoutAll: "/v1/auth/mobile/logout-all",
    changePassword: "/v1/auth/change-password",
    account: "/v1/auth/account",
    logout: "/v1/auth/logout"
  },
  public: {
    landing: "/v1/public/landing"
  },
  vehicles: {
    catalog: "/v1/vehicle-catalog",
    list: "/v1/vehicles",
    detail: "/v1/vehicles/:vehicleId",
    mileage: "/v1/vehicles/:vehicleId/mileage",
    imageUpload: "/v1/vehicle-images",
    serviceLogs: "/v1/vehicles/:vehicleId/service-logs",
    serviceLogDetail: "/v1/vehicles/:vehicleId/service-logs/:serviceLogId",
    maintenancePlan: "/v1/vehicles/:vehicleId/maintenance-plan",
    maintenancePlanRequest: "/v1/vehicles/:vehicleId/maintenance-plan/request",
    maintenancePlanAssignTemplate: "/v1/vehicles/:vehicleId/maintenance-plan/assign-template",
    maintenancePlanItemStatus: "/v1/vehicles/:vehicleId/maintenance-plan/items/:planItemId/status",
    maintenancePlanItemComplete: "/v1/vehicles/:vehicleId/maintenance-plan/items/:planItemId/complete"
  },
  catalog: {
    list: "/v1/catalog",
    reminders: "/v1/reminders"
  }
} as const;
