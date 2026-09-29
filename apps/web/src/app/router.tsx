import { PERMISSIONS } from '@skoolledger/shared';
import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { NotFoundPage } from '@/components/NotFoundPage';
import { AuditLogPage } from '@/features/audit/AuditLogPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { RequireAnonymous, RequireAuth, RequirePermission } from '@/features/auth/guards';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { PENDING_ITEMS } from './navigation';

/**
 * Screens whose backend module is not built yet ("UI ready — backend module
 * pending"). Lazy-loaded so their sample data and chart library stay out of
 * the main bundle.
 */
const PENDING_PAGES: Record<string, () => Promise<{ Component: ComponentType }>> = {
  '/students': () =>
    import('@/features/students/StudentsPage').then((m) => ({ Component: m.StudentsPage })),
  '/fees': () => import('@/features/fees/FeesPage').then((m) => ({ Component: m.FeesPage })),
  '/vouchers': () =>
    import('@/features/vouchers/VouchersPage').then((m) => ({ Component: m.VouchersPage })),
  '/payments': () =>
    import('@/features/payments/PaymentsPage').then((m) => ({ Component: m.PaymentsPage })),
  '/defaulters': () =>
    import('@/features/defaulters/DefaultersPage').then((m) => ({ Component: m.DefaultersPage })),
  '/payroll': () =>
    import('@/features/payroll/PayrollPage').then((m) => ({ Component: m.PayrollPage })),
  '/expenses': () =>
    import('@/features/expenses/ExpensesPage').then((m) => ({ Component: m.ExpensesPage })),
  '/inventory': () =>
    import('@/features/inventory/InventoryPage').then((m) => ({ Component: m.InventoryPage })),
  '/purchases': () =>
    import('@/features/purchases/PurchasesPage').then((m) => ({ Component: m.PurchasesPage })),
  '/accounts': () =>
    import('@/features/accounts/AccountsPage').then((m) => ({ Component: m.AccountsPage })),
  '/reports': () =>
    import('@/features/reports/ReportsPage').then((m) => ({ Component: m.ReportsPage })),
};

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
          ...PENDING_ITEMS.map((item) => {
            const lazy = PENDING_PAGES[item.path];
            if (!lazy) throw new Error(`No page registered for pending module ${item.path}`);
            return { path: item.path.slice(1), lazy };
          }),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
