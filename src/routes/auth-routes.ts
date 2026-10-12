import { API_ROUTES } from "../constants/routes";
import { changePassword, deleteAccount, getCsrf, googleLogin, login, logout, me, register, updatePreferences, updateProfile, uploadAvatar } from "../controllers/auth-controller";
import {
  mobileGoogleLogin,
  mobileLogin,
  mobileLogout,
  mobileLogoutAll,
  mobileLogoutCurrent,
  mobileRefresh,
  mobileRegister,
  mobileSessions
} from "../controllers/mobile-auth-controller";
import type { RouteDefinition } from "../utils/http";

export const authRoutes: RouteDefinition[] = [
  { method: "GET", path: API_ROUTES.auth.csrf, handler: getCsrf },
  { method: "GET", path: API_ROUTES.auth.me, handler: me },
  { method: "PATCH", path: API_ROUTES.auth.profile, handler: updateProfile, auth: true, csrf: true },
  { method: "POST", path: API_ROUTES.auth.avatarUpload, handler: uploadAvatar, auth: true, csrf: true },
  { method: "PATCH", path: API_ROUTES.auth.preferences, handler: updatePreferences, auth: true, csrf: true },
  { method: "POST", path: API_ROUTES.auth.register, handler: register, csrf: true },
  { method: "POST", path: API_ROUTES.auth.login, handler: login, csrf: true },
  { method: "POST", path: API_ROUTES.auth.google, handler: googleLogin, csrf: true },
  { method: "POST", path: API_ROUTES.auth.mobileRegister, handler: mobileRegister },
  { method: "POST", path: API_ROUTES.auth.mobileLogin, handler: mobileLogin },
  { method: "POST", path: API_ROUTES.auth.mobileGoogle, handler: mobileGoogleLogin },
  { method: "POST", path: API_ROUTES.auth.mobileRefresh, handler: mobileRefresh },
  { method: "POST", path: API_ROUTES.auth.mobileLogout, handler: mobileLogout },
  { method: "GET", path: API_ROUTES.auth.mobileSessions, handler: mobileSessions, auth: true },
  { method: "POST", path: API_ROUTES.auth.mobileLogoutCurrent, handler: mobileLogoutCurrent, auth: true },
  { method: "POST", path: API_ROUTES.auth.mobileLogoutAll, handler: mobileLogoutAll, auth: true },
  { method: "POST", path: API_ROUTES.auth.changePassword, handler: changePassword, auth: true, csrf: true },
  { method: "DELETE", path: API_ROUTES.auth.account, handler: deleteAccount, auth: true, csrf: true },
  { method: "POST", path: API_ROUTES.auth.logout, handler: logout, auth: true, csrf: true }
];
