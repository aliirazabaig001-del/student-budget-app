import type { PermissionCode } from '@skoolledger/shared';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageLoader } from '@/components/FullPageLoader';
import { NoAccess } from '@/components/NoAccess';
import { useAuth } from './auth-context';

/** Only signed-in users; users who must change their password are sent there first. */
export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'anonymous' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

/** Only for visitors who are not signed in (e.g. the login page). */
export function RequireAnonymous({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Hides a page from users without permission. This is a usability measure
 * only: the API enforces the same permissions on every request.
 */
export function RequirePermission({
  permissions,
  children,
}: {
  permissions: PermissionCode[];
  children: ReactNode;
}) {
  const { can } = useAuth();
  return can(...permissions) ? <>{children}</> : <NoAccess />;
}
