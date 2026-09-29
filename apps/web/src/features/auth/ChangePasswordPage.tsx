import { zodResolver } from '@hookform/resolvers/zod';
import {
  PASSWORD_MIN_LENGTH,
  changePasswordSchema,
  type ChangePasswordInput,
} from '@skoolledger/shared';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  PasswordInput,
} from '@skoolledger/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { BrandMark } from '@/components/BrandMark';
import { applyServerErrors } from '@/lib/form-errors';
import { useAuth, useCurrentUser } from './auth-context';

export function ChangePasswordPage() {
  const user = useCurrentUser();
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const forced = user.mustChangePassword;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await changePassword(values);
      toast.success('Your password has been changed. Other devices have been signed out.');
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-12">
      <BrandMark />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{forced ? 'Choose a new password' : 'Change password'}</CardTitle>
          <CardDescription>
            {forced
              ? 'For your security, please replace the temporary password before continuing.'
              : 'Changing your password signs you out on all other devices.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {formError && <Alert variant="destructive" title={formError} />}
            <FormField
              id="currentPassword"
              label="Current password"
              error={errors.currentPassword?.message}
            >
              <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
            </FormField>
            <FormField
              id="newPassword"
              label="New password"
              hint={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
              error={errors.newPassword?.message}
            >
              <PasswordInput autoComplete="new-password" {...register('newPassword')} />
            </FormField>
            <FormField
              id="confirmPassword"
              label="Confirm new password"
              error={errors.confirmPassword?.message}
            >
              <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
            </FormField>
            <div className="flex items-center justify-between gap-3 pt-2">
              {forced ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void logout().then(() => navigate('/login', { replace: true }))}
                >
                  Sign out
                </Button>
              ) : (
                <Button asChild variant="ghost">
                  <Link to="/">Cancel</Link>
                </Button>
              )}
              <Button type="submit" loading={isSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
