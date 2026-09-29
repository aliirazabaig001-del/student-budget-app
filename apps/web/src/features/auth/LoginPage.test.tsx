import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './auth-context';
import { LoginPage } from './LoginPage';

vi.mock('@/features/settings/api', () => ({
  useBranding: () => ({
    data: { schoolName: 'Iqra Public School', campusName: null, hasLogo: false },
  }),
  logoUrl: () => '',
}));

function renderLogin(login: AuthContextValue['login']) {
  const auth: AuthContextValue = {
    status: 'anonymous',
    user: null,
    login,
    logout: vi.fn(),
    changePassword: vi.fn(),
    can: () => false,
  };
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('shows the school name from branding', () => {
    renderLogin(vi.fn());
    expect(screen.getByRole('heading', { name: 'Iqra Public School' })).toBeInTheDocument();
  });

  it('validates required fields before calling the API', async () => {
    const login = vi.fn();
    renderLogin(login);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('submits normalised credentials and shows server errors', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid email/username or password.'));
    renderLogin(login);

    await userEvent.type(screen.getByLabelText('Email or username'), '  Admin ');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith({ identifier: 'admin', password: 'secret-password' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email/username or password.',
    );
  });
});
