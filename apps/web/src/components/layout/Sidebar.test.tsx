import { PERMISSIONS, type AuthUser } from '@skoolledger/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context';
import { Sidebar } from './Sidebar';

function renderWith(permissions: string[]) {
  const user = { permissions } as AuthUser;
  const auth: AuthContextValue = {
    status: 'authenticated',
    user,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    can: (...required) => required.every((p) => permissions.includes(p)),
  };
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('Sidebar', () => {
  it('shows every planned module, marking unbuilt ones as previews', () => {
    renderWith([PERMISSIONS.DASHBOARD_VIEW]);
    for (const label of [
      'Dashboard',
      'Students',
      'Fees',
      'Vouchers',
      'Payments',
      'Defaulters',
      'Payroll',
      'Expenses',
      'Inventory',
      'Purchases',
      'Accounts',
      'Reports',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Students/ })).toHaveTextContent('Preview');
  });

  it('hides administration pages the user cannot open', () => {
    renderWith([PERMISSIONS.DASHBOARD_VIEW]);
    expect(screen.queryByRole('link', { name: /Users/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Audit Log/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Settings/ })).not.toBeInTheDocument();
  });

  it('shows administration pages to administrators', () => {
    renderWith([
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.SETTINGS_READ,
    ]);
    expect(screen.getByRole('link', { name: /Users/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Audit Log/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/ })).toBeInTheDocument();
  });
});
