import { z } from 'zod';
import { paginationQuerySchema } from './common';

/**
 * Audit action codes. Stored as plain strings so future modules can add their
 * own (e.g. `payment.recorded`) without a database migration.
 */
export const AUDIT_ACTIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_CHANGED: 'auth.password_changed',
  AUTH_REFRESH_REUSE_DETECTED: 'auth.refresh_reuse_detected',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_ROLES_CHANGED: 'user.roles_changed',
  SETTINGS_UPDATED: 'settings.updated',
  SETTINGS_LOGO_UPDATED: 'settings.logo_updated',
  SETTINGS_LOGO_REMOVED: 'settings.logo_removed',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in',
  'auth.logout': 'Signed out',
  'auth.password_changed': 'Changed password',
  'auth.refresh_reuse_detected': 'Session token reuse blocked',
  'user.created': 'Created user',
  'user.updated': 'Updated user',
  'user.password_reset': 'Reset user password',
  'user.roles_changed': 'Changed user roles',
  'settings.updated': 'Updated school settings',
  'settings.logo_updated': 'Uploaded school logo',
  'settings.logo_removed': 'Removed school logo',
};

export const AUDIT_ENTITIES = {
  USER: 'User',
  SCHOOL: 'School',
  SESSION: 'Session',
} as const;

export const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().trim().max(100).optional(),
  entity: z.string().trim().max(100).optional(),
  actorId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
