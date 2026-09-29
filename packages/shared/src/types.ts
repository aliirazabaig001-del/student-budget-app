/**
 * API response contracts shared by the backend and the web app.
 * Dates are ISO-8601 strings on the wire.
 */

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const API_ERROR_CODES = {
  PASSWORD_CHANGE_REQUIRED: 'PASSWORD_CHANGE_REQUIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  /** Machine-readable reason for errors the client handles specially. */
  code?: ApiErrorCode;
  /** Field-level validation errors, keyed by dotted path. */
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

export interface RoleSummary {
  key: string;
  name: string;
}

export interface RoleDto extends RoleSummary {
  id: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionDto {
  code: string;
  module: string;
  description: string;
}

export interface AuthUser {
  id: string;
  schoolId: string;
  fullName: string;
  email: string;
  username: string;
  mustChangePassword: boolean;
  roles: RoleSummary[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
  user: AuthUser;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: RoleSummary[];
}

export interface SchoolSettingsDto {
  schoolId: string;
  schoolName: string;
  campusName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  academicSession: string | null;
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
  iban: string | null;
  jazzCash: string | null;
  easypaisa: string | null;
  hasLogo: boolean;
  logoUpdatedAt: string | null;
  updatedAt: string;
}

/** Public, unauthenticated branding used by the login screen. */
export interface PublicBrandingDto {
  schoolName: string | null;
  campusName: string | null;
  hasLogo: boolean;
  logoUpdatedAt: string | null;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actor: { id: string; fullName: string; username: string } | null;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface HealthDto {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  version: string;
  time: string;
}
