import { zodResolver } from '@hookform/resolvers/zod';
import { APP_NAME, APP_TAGLINE, loginSchema, type LoginInput } from '@skoolledger/shared';
import { Alert, Button, FormField, Input, PasswordInput } from '@skoolledger/ui';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { BrandMark, LogoGlyph } from '@/components/BrandMark';
import { logoUrl, useBranding } from '@/features/settings/api';
import { errorMessage } from '@/lib/api-client';
import { useAuth } from './auth-context';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: branding } = useBranding();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(user.mustChangePassword ? '/change-password' : (from ?? '/'), { replace: true });
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <div className="grid min-h-full lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <BrandMark inverted />
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-white">
            School finance and operations, in one place.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-muted">
            {APP_TAGLINE}. Installed on your school&apos;s own computer, used from any browser on
            your network.
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-sidebar-muted">
          <ShieldCheck className="size-4" aria-hidden /> Your data stays on your school&apos;s
          server.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            {branding?.hasLogo ? (
              <img
                src={logoUrl(branding.logoUpdatedAt)}
                alt=""
                className="mb-4 size-16 rounded-lg object-contain"
              />
            ) : (
              <LogoGlyph className="mb-4 size-12 lg:hidden" />
            )}
            <h2 className="text-xl font-semibold tracking-tight">
              {branding?.schoolName ?? APP_NAME}
            </h2>
            {branding?.campusName && (
              <p className="text-sm text-muted-foreground">{branding.campusName}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {formError && <Alert variant="destructive" title={formError} />}

            <FormField id="identifier" label="Email or username" error={errors.identifier?.message}>
              <Input autoComplete="username" autoFocus {...register('identifier')} />
            </FormField>

            <FormField id="password" label="Password" error={errors.password?.message}>
              <PasswordInput autoComplete="current-password" {...register('password')} />
            </FormField>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Forgot your password? Ask your School Admin to reset it.
          </p>
          <p className="mt-6 text-center text-[11px] text-muted-foreground lg:hidden">
            {APP_NAME} · {APP_TAGLINE}
          </p>
        </div>
      </main>
    </div>
  );
}
