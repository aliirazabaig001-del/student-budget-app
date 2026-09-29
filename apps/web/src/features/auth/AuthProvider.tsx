import {
  hasAllPermissions,
  type AuthUser,
  type ChangePasswordInput,
  type LoginInput,
  type LoginResponse,
  type PermissionCode,
} from '@skoolledger/shared';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, onSessionEvent, refreshSession, setAccessToken } from '@/lib/api-client';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const applySession = useCallback((response: LoginResponse) => {
    setAccessToken(response.accessToken);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the refresh cookie when the app loads.
  useEffect(() => {
    let cancelled = false;
    void refreshSession().then((response) => {
      if (cancelled) return;
      if (response) applySession(response);
      else setStatus('anonymous');
    });
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  // Keep state in sync with refreshes / expiry detected by the API client.
  useEffect(
    () =>
      onSessionEvent((event) => {
        if (event.type === 'refreshed') setUser(event.response.user);
        if (event.type === 'expired') clearSession();
        if (event.type === 'password-change-required') {
          setUser((current) => (current ? { ...current, mustChangePassword: true } : current));
        }
      }),
    [clearSession],
  );

  // Refresh the access token shortly before it expires while the app is open.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = window.setInterval(() => void refreshSession(), 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
      });
      applySession(response);
      return response.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      const response = await apiRequest<LoginResponse>('/auth/change-password', {
        method: 'POST',
        body: input,
      });
      applySession(response);
    },
    [applySession],
  );

  const can = useCallback(
    (...permissions: PermissionCode[]) =>
      !!user && hasAllPermissions(user.permissions, permissions),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, changePassword, can }),
    [status, user, login, logout, changePassword, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
