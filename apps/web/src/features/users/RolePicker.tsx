import { hasAllPermissions, type RoleDto } from '@skoolledger/shared';
import { Checkbox, Skeleton, cn } from '@skoolledger/ui';
import { useCurrentUser } from '@/features/auth/auth-context';

/**
 * Role checkboxes. Roles with permissions the current user does not hold are
 * disabled here; the API rejects them as well (anti-privilege-escalation).
 */
export function RolePicker({
  roles,
  loading,
  value,
  onChange,
  disabled,
  error,
}: {
  roles: RoleDto[] | undefined;
  loading?: boolean;
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const me = useCurrentUser();

  if (loading || !roles) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const toggle = (key: string, checked: boolean) =>
    onChange(checked ? [...value, key] : value.filter((k) => k !== key));

  return (
    <fieldset className="space-y-2" aria-describedby={error ? 'roles-error' : undefined}>
      <legend className="mb-2 text-sm font-medium">
        Roles<span className="ml-0.5 text-destructive">*</span>
      </legend>
      {roles.map((role) => {
        const grantable = hasAllPermissions(me.permissions, role.permissions);
        const id = `role-${role.key}`;
        return (
          <label
            key={role.key}
            htmlFor={id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/40',
              (!grantable || disabled) && 'cursor-not-allowed opacity-60',
            )}
          >
            <Checkbox
              id={id}
              className="mt-0.5"
              checked={value.includes(role.key)}
              disabled={!grantable || disabled}
              onChange={(e) => toggle(role.key, e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium">{role.name}</span>
              <span className="block text-xs text-muted-foreground">
                {grantable ? role.description : 'Only a user who holds this role can assign it.'}
              </span>
            </span>
          </label>
        );
      })}
      {error && (
        <p id="roles-error" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
