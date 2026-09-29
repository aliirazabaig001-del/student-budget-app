import { PERMISSIONS } from '@skoolledger/shared';
import { createBrowserRouter } from 'react-router';
import { ComingSoonPage } from '@/components/ComingSoonPage';
import { AppShell } from '@/components/layout/AppShell';
import { NotFoundPage } from '@/components/NotFoundPage';
import { AuditLogPage } from '@/features/audit/AuditLogPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { RequireAnonymous, RequireAuth, RequirePermission } from '@/features/auth/guards';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { COMING_SOON_ITEMS } from './navigation';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RequireAnonymous>
        <LoginPage />
      </RequireAnonymous>
    ),
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: (
              <RequirePermission permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
                <DashboardPage />
              </RequirePermission>
            ),
          },
          {
            path: 'users',
            element: (
              <RequirePermission permissions={[PERMISSIONS.USERS_READ]}>
                <UsersPage />
              </RequirePermission>
            ),
          },
          {
            path: 'audit-log',
            element: (
              <RequirePermission permissions={[PERMISSIONS.AUDIT_READ]}>
                <AuditLogPage />
              </RequirePermission>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequirePermission permissions={[PERMISSIONS.SETTINGS_READ]}>
                <SettingsPage />
              </RequirePermission>
            ),
          },
          ...COMING_SOON_ITEMS.map((item) => ({
            path: item.path.slice(1),
            element: (
              <ComingSoonPage
                title={item.label}
                milestone={item.comingSoon.milestone}
                summary={item.comingSoon.summary}
              />
            ),
          })),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
