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
    <div className="min-h-full bg-background lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute -right-28 -top-28 size-80 rounded-full border-[38px] border-[#2d3c59]"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-28 size-[420px] rounded-full border-[55px] border-[#263653]"
        />
        <BrandMark inverted className="relative" />
        <div className="relative max-w-md">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">
            Operations with a clear ledger
          </p>
          <h1 className="font-display text-[48px] font-extrabold leading-[1.04] tracking-[-0.055em] text-white">
            Make every school rupee accountable.
          </h1>
          <p className="mt-6 max-w-sm text-[14px] leading-6 text-[#b9c5d7]">
            A calm, precise workspace for fees, payroll, inventory and the decisions behind a
            healthy school.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-[11px] text-sidebar-muted">
          <ShieldCheck className="size-4" aria-hidden /> Secure sign-in. Each school&apos;s records
          are kept separate.
        </p>
      </aside>

      <main className="flex min-h-full items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 flex items-center gap-3">
            {branding?.hasLogo ? (
              <img
                src={logoUrl(branding.logoUpdatedAt)}
                alt=""
                className="size-12 rounded-lg object-contain"
              />
            ) : (
              <LogoGlyph className="size-10 lg:hidden" />
            )}
            {branding?.schoolName && (
              <div className="leading-tight">
                <h2 className="font-display text-[15px] font-extrabold text-primary">
                  {branding.schoolName}
                </h2>
                {branding.campusName && (
                  <p className="text-xs text-muted-foreground">{branding.campusName}</p>
                )}
              </div>
            )}
          </div>
          <div className="mb-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.17em] text-warning">
              Welcome back
            </p>
            <h3 className="font-display text-[30px] font-extrabold tracking-[-0.05em] text-primary">
              Sign in to {APP_NAME}
            </h3>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Use your school workspace credentials to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {formError && <Alert variant="destructive" title={formError} />}

            <FormField id="identifier" label="Email or username" error={errors.identifier?.message}>
              <Input
                autoComplete="username"
                autoFocus
                placeholder="you@school.edu"
                className="h-11"
                {...register('identifier')}
              />
            </FormField>

            <FormField id="password" label="Password" error={errors.password?.message}>
              <PasswordInput
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11"
                {...register('password')}
              />
            </FormField>

            <Button type="submit" className="h-11 w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Forgot your password? Ask your School Admin to reset it.
          </p>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            {APP_NAME} · {APP_TAGLINE}
          </p>
        </div>
      </main>
    </div>
  );
}
