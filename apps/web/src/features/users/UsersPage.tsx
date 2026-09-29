import { PERMISSIONS, type UserDto } from '@skoolledger/shared';
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  NativeSelect,
} from '@skoolledger/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, MoreHorizontal, Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/DataTable';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { useAuth, useCurrentUser } from '@/features/auth/auth-context';
import { errorMessage } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { useUpdateUser, useUsers } from './api';
import { CreateUserDialog, EditUserDialog, ResetPasswordDialog } from './UserDialogs';

type StatusFilter = 'all' | 'active' | 'inactive';
const PAGE_SIZE = 20;

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function UsersPage() {
  const me = useCurrentUser();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [resetting, setResetting] = useState<UserDto | null>(null);
  const debouncedSearch = useDebounced(search.trim(), 300);

  useEffect(() => setPage(1), [debouncedSearch, status]);

  const users = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status,
  });
  const { mutateAsync: updateUser } = useUpdateUser();

  const canCreate = can(PERMISSIONS.USERS_CREATE, PERMISSIONS.ROLES_ASSIGN);
  const canUpdate = can(PERMISSIONS.USERS_UPDATE);
  const canReset = can(PERMISSIONS.USERS_RESET_PASSWORD);

  const columns = useMemo<ColumnDef<UserDto, unknown>[]>(() => {
    const toggleActive = async (user: UserDto) => {
      try {
        await updateUser({ id: user.id, input: { isActive: !user.isActive } });
        toast.success(
          user.isActive
            ? `${user.fullName} deactivated and signed out.`
            : `${user.fullName} activated.`,
        );
      } catch (error) {
        toast.error(errorMessage(error));
      }
    };

    return [
      {
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.fullName}
              {row.original.id === me.id && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">@{row.original.username}</div>
          </div>
        ),
      },
      { header: 'Email', accessorKey: 'email' },
      {
        header: 'Roles',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role) => (
              <Badge key={role.key} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: 'Status',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
      },
      {
        header: 'Last sign-in',
        cell: ({ row }) => (
          <span className="tabular text-muted-foreground">
            {formatDateTime(row.original.lastLoginAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        size: 48,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === me.id;
          if (!canUpdate && !canReset) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for ${user.fullName}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && (
                  <DropdownMenuItem onSelect={() => setEditing(user)}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                )}
                {canReset && !isSelf && (
                  <DropdownMenuItem onSelect={() => setResetting(user)}>
                    <KeyRound /> Reset password
                  </DropdownMenuItem>
                )}
                {canUpdate && !isSelf && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void toggleActive(user)}>
                      {user.isActive ? (
                        <>
                          <UserX /> Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck /> Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [me.id, canUpdate, canReset, updateUser]);

  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in to SkoolLedger and what each of them is allowed to do."
        actions={
          canCreate && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Add user
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search by name, email or username"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
          </div>
          <NativeSelect
            className="sm:w-44"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </NativeSelect>
        </div>

        {users.isError ? (
          <div className="p-4">
            <ErrorState error={users.error} onRetry={() => void users.refetch()} />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={users.data?.items ?? []}
              loading={users.isLoading}
              getRowId={(u) => u.id}
              emptyMessage={debouncedSearch ? 'No users match your search.' : 'No users yet.'}
            />
            {users.data && (
              <Pagination
                page={users.data.page}
                pageSize={users.data.pageSize}
                total={users.data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      <CreateUserDialog open={creating} onOpenChange={setCreating} />
      <EditUserDialog user={editing} onClose={() => setEditing(null)} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
    </>
  );
}
