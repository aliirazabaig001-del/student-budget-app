/**
 * Permission catalogue.
 *
 * This is the single source of truth for every permission code in SkoolLedger.
 * - The API seeds these into the `Permission` table and enforces them with guards.
 * - The web app uses them only to decide what to *show*; the API always re-checks.
 *
 * When a new module is added (e.g. Fees in Milestone 3), add its permissions here,
 * map them to roles in `roles.ts`, and re-run the seed. Never rename an existing
 * code: it is stored in the database and referenced by audit history.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',

  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_RESET_PASSWORD: 'users.reset_password',

  ROLES_READ: 'roles.read',
  ROLES_ASSIGN: 'roles.assign',

  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',

  AUDIT_READ: 'audit.read',

  /** Installation-level administration (reserved for Super Admin). */
  SYSTEM_MANAGE: 'system.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  code: PermissionCode;
  module: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  { code: PERMISSIONS.DASHBOARD_VIEW, module: 'Dashboard', description: 'View the dashboard' },
  { code: PERMISSIONS.USERS_READ, module: 'Users', description: 'View users' },
  { code: PERMISSIONS.USERS_CREATE, module: 'Users', description: 'Create users' },
  {
    code: PERMISSIONS.USERS_UPDATE,
    module: 'Users',
    description: 'Edit users and activate or deactivate accounts',
  },
  {
    code: PERMISSIONS.USERS_RESET_PASSWORD,
    module: 'Users',
    description: "Reset another user's password",
  },
  { code: PERMISSIONS.ROLES_READ, module: 'Roles', description: 'View roles and permissions' },
  { code: PERMISSIONS.ROLES_ASSIGN, module: 'Roles', description: 'Assign roles to users' },
  { code: PERMISSIONS.SETTINGS_READ, module: 'Settings', description: 'View school settings' },
  {
    code: PERMISSIONS.SETTINGS_UPDATE,
    module: 'Settings',
    description: 'Change school settings and branding',
  },
  { code: PERMISSIONS.AUDIT_READ, module: 'Audit Log', description: 'View the audit log' },
  {
    code: PERMISSIONS.SYSTEM_MANAGE,
    module: 'System',
    description: 'Installation-level administration',
  },
];

export const ALL_PERMISSION_CODES: readonly PermissionCode[] = PERMISSION_DEFINITIONS.map(
  (p) => p.code,
);

export function isPermissionCode(value: string): value is PermissionCode {
  return (ALL_PERMISSION_CODES as readonly string[]).includes(value);
}

/** True when every permission in `required` is present in `granted`. */
export function hasAllPermissions(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  const set = new Set(granted);
  return required.every((code) => set.has(code));
}
