import { zodResolver } from '@hookform/resolvers/zod';
import {
  PASSWORD_MIN_LENGTH,
  PERMISSIONS,
  createUserSchema,
  editUserFormSchema,
  resetUserPasswordSchema,
  type CreateUserInput,
  type EditUserFormInput,
  type ResetUserPasswordInput,
  type UserDto,
} from '@skoolledger/shared';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from '@skoolledger/ui';
import { useState } from 'react';
import type { z } from 'zod';
import { Controller, type FieldErrors, type UseFormRegister, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth, useCurrentUser } from '@/features/auth/auth-context';
import { applyServerErrors } from '@/lib/form-errors';
import {
  useCreateUser,
  useResetUserPassword,
  useRoles,
  useSetUserRoles,
  useUpdateUser,
} from './api';
import { RolePicker } from './RolePicker';

type ProfileValues = Pick<CreateUserInput, 'fullName' | 'email' | 'username'>;

function ProfileFields({
  register,
  errors,
}: {
  register: UseFormRegister<ProfileValues>;
  errors: FieldErrors<ProfileValues>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        id="fullName"
        label="Full name"
        required
        error={errors.fullName?.message}
        className="sm:col-span-2"
      >
        <Input autoComplete="off" {...register('fullName')} />
      </FormField>
      <FormField id="email" label="Email" required error={errors.email?.message}>
        <Input type="email" autoComplete="off" {...register('email')} />
      </FormField>
      <FormField
        id="username"
        label="Username"
        required
        hint="Used to sign in. Lowercase letters, numbers, . _ -"
        error={errors.username?.message}
      >
        <Input autoComplete="off" {...register('username')} />
      </FormField>
    </div>
  );
}

/** Role checkboxes backed by the roles list from the API. */
function RolesField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string[];
  onChange: (keys: string[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const roles = useRoles();
  return (
    <RolePicker
      roles={roles.data}
      loading={roles.isLoading}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
    />
  );
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateUser();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof createUserSchema>, unknown, CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      username: '',
      password: '',
      roleKeys: [],
      mustChangePassword: true,
    },
  });

  const close = (next: boolean) => {
    if (!next) {
      reset();
      setFormError(null);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await create.mutateAsync(values);
      toast.success(`User ${user.fullName} created.`);
      close(false);
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a sign-in for a staff member and choose what they can do.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {formError && <Alert variant="destructive" title={formError} />}
          <ProfileFields
            register={register as unknown as UseFormRegister<ProfileValues>}
            errors={errors}
          />
          <FormField
            id="password"
            label="Temporary password"
            required
            hint={`At least ${PASSWORD_MIN_LENGTH} characters with a letter and a number. Share it with the user privately.`}
            error={errors.password?.message}
          >
            <Input type="text" autoComplete="new-password" {...register('password')} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register('mustChangePassword')} />
            Require the user to choose a new password when they first sign in
          </label>
          <Controller
            control={control}
            name="roleKeys"
            render={({ field }) => (
              <RolesField
                value={field.value}
                onChange={field.onChange}
                error={errors.roleKeys?.message}
              />
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({ user, onClose }: { user: UserDto | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {/* Keyed so the form re-initialises for each user. */}
        {user && <EditUserForm key={user.id} user={user} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const me = useCurrentUser();
  const { can } = useAuth();
  const update = useUpdateUser();
  const setRoles = useSetUserRoles();
  const [formError, setFormError] = useState<string | null>(null);
  const isSelf = me.id === user.id;
  const canAssignRoles = can(PERMISSIONS.ROLES_ASSIGN) && !isSelf;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<EditUserFormInput>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      roleKeys: user.roles.map((r) => r.key),
    },
  });

  const onSubmit = handleSubmit(async ({ roleKeys, ...profile }) => {
    setFormError(null);
    try {
      const changedProfile = Object.fromEntries(
        Object.entries(profile).filter(([key]) => dirtyFields[key as keyof typeof profile]),
      );
      if (Object.keys(changedProfile).length > 0) {
        await update.mutateAsync({ id: user.id, input: changedProfile });
      }
      if (canAssignRoles && dirtyFields.roleKeys) {
        await setRoles.mutateAsync({ id: user.id, roleKeys });
      }
      toast.success('User updated.');
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
        <DialogDescription>Changes are recorded in the audit log.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Alert variant="destructive" title={formError} />}
        <ProfileFields
          register={register as unknown as UseFormRegister<ProfileValues>}
          errors={errors}
        />
        {isSelf && (
          <Alert variant="info">You cannot change your own roles. Ask another administrator.</Alert>
        )}
        <Controller
          control={control}
          name="roleKeys"
          render={({ field }) => (
            <RolesField
              value={field.value}
              onChange={field.onChange}
              error={errors.roleKeys?.message}
              disabled={!canAssignRoles}
            />
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: UserDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {user && <ResetPasswordForm key={user.id} user={user} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordForm({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const reset = useResetUserPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof resetUserPasswordSchema>, unknown, ResetUserPasswordInput>({
    resolver: zodResolver(resetUserPasswordSchema),
    defaultValues: { newPassword: '', mustChangePassword: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await reset.mutateAsync({ id: user.id, input: values });
      toast.success(`Password reset for ${user.fullName}. They have been signed out everywhere.`);
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>
          Set a temporary password for {user.fullName}. They will be signed out of all devices.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert variant="destructive" title={formError} />}
        <FormField
          id="newPassword"
          label="Temporary password"
          required
          hint={`At least ${PASSWORD_MIN_LENGTH} characters with a letter and a number.`}
          error={errors.newPassword?.message}
        >
          <Input type="text" autoComplete="new-password" {...register('newPassword')} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register('mustChangePassword')} />
          Require a new password at next sign-in
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Reset password
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
