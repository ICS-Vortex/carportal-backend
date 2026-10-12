export interface UserRecord {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  avatar_url: string | null;
  locale: string;
  role: "user" | "admin";
  is_blocked: boolean;
  blocked_at: Date | null;
  preferred_service_station_id: string | null;
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleBrandRecord {
  id: string;
  slug: string;
  name: string;
}

export interface VehicleModelRecord {
  id: string;
  brand_id: string;
  slug: string;
  name: string;
}

export interface VehicleGenerationRecord {
  id: string;
  model_id: string;
  slug: string;
  name: string;
  year_from: number;
  year_to: number;
  notes_uk: string | null;
}

export interface VehicleConfigurationRecord {
  id: string;
  generation_id: string;
  slug: string;
  engine_label: string;
  transmission_label: string;
  drivetrain_label: string | null;
  fuel_type: string | null;
  notes_uk: string | null;
}

export interface VehicleRecord {
  id: string;
  user_id: string;
  generation_id: string;
  configuration_id: string;
  make: string;
  model: string;
  generation: string | null;
  engine_name: string;
  transmission_name: string;
  drivetrain_label: string | null;
  fuel_type: string | null;
  year: number;
  vin: string | null;
  license_plate: string | null;
  image_url: string | null;
  mileage_km: number;
  last_service_date: string | null;
  last_service_mileage_km: number | null;
  has_maintenance_plan: boolean;
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProcedureRecord {
  id: string;
  code: string;
  title_uk: string;
  description_uk: string | null;
  default_interval_km: number | null;
  default_interval_months: number | null;
  labor_price_uah: number | null;
  category: string;
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceLogRecord {
  id: string;
  vehicle_id: string;
  service_date: string;
  mileage_km: number;
  service_station: string | null;
  notes_uk: string | null;
}

export interface ReminderRecord {
  id: string;
  vehicle_id: string;
  procedure_id: string;
  due_date: string | null;
  due_mileage_km: number | null;
  remind_days_before: number;
  status: "upcoming" | "due" | "done" | "sent";
}

export interface VehicleMaintenancePlanRecord {
  id: string;
  vehicle_id: string;
  template_id: string | null;
  template_name: string;
  source_template_updated_at: Date;
  assigned_at: Date;
  updated_at: Date;
}

export interface VehicleMaintenancePlanItemRecord {
  id: string;
  plan_id: string;
  procedure_id: string | null;
  procedure_title: string;
  procedure_category: string;
  interval_km: number | null;
  interval_months: number | null;
  notes_uk: string | null;
  labor_price_uah: number | null;
  sort_order: number;
  status: "pending" | "done" | "skipped";
  baseline_date: string;
  baseline_mileage_km: number;
  last_completed_at: string | null;
  last_completed_mileage_km: number | null;
  last_service_log_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenancePlanRequestRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  status: "open" | "resolved";
  request_note: string | null;
  handled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  sessionId?: string | null;
}

export interface AuthRefreshSessionRecord {
  id: string;
  user_id: string;
  family_id: string;
  token_hash: string;
  user_agent: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_session_id: string | null;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MobileSessionView {
  id: string;
  family_id: string;
  user_agent: string | null;
  expires_at: Date;
  last_used_at: Date | null;
  created_at: Date;
  is_current: boolean;
}
