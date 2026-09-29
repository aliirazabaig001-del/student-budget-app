import { ALL_PERMISSION_CODES, PERMISSIONS, type PermissionCode } from './permissions';

export const SYSTEM_ROLE_KEYS = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  ACCOUNTANT: 'accountant',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const;

export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[keyof typeof SYSTEM_ROLE_KEYS];

export interface SystemRoleDefinition {
  key: SystemRoleKey;
  name: string;
  description: string;
  permissions: readonly PermissionCode[];
}

const P = PERMISSIONS;

/**
 * Built-in roles. The seed keeps the database in sync with this list.
 *
 * Accountant, Operator and Viewer currently differ very little because the
 * finance modules do not exist yet. Their fee/payroll/expense permissions will
 * be added milestone by milestone.
 */
export const SYSTEM_ROLES: readonly SystemRoleDefinition[] = [
  {
    key: SYSTEM_ROLE_KEYS.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full control of the installation, including other administrators.',
    permissions: ALL_PERMISSION_CODES,
  },
  {
    key: SYSTEM_ROLE_KEYS.SCHOOL_ADMIN,
    name: 'School Admin',
    description: 'Manages school settings, users and day-to-day administration.',
    permissions: ALL_PERMISSION_CODES.filter((code) => code !== P.SYSTEM_MANAGE),
  },
  {
    key: SYSTEM_ROLE_KEYS.ACCOUNTANT,
    name: 'Accountant',
    description:
      'Handles fees, payments, payroll and expenses (modules arrive in later milestones).',
    permissions: [P.DASHBOARD_VIEW, P.SETTINGS_READ, P.AUDIT_READ],
  },
  {
    key: SYSTEM_ROLE_KEYS.OPERATOR,
    name: 'Operator',
    description: 'Data entry for students and fee collection (modules arrive in later milestones).',
    permissions: [P.DASHBOARD_VIEW, P.SETTINGS_READ],
  },
  {
    key: SYSTEM_ROLE_KEYS.VIEWER,
    name: 'Viewer',
    description: 'Read-only access to the dashboard and reports.',
    permissions: [P.DASHBOARD_VIEW],
  },
];
