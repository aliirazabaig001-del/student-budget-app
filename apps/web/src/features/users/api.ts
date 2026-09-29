import type {
  CreateUserInput,
  ListUsersQuery,
  Paginated,
  ResetUserPasswordInput,
  RoleDto,
  UpdateUserInput,
  UserDto,
} from '@skoolledger/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';

export const userKeys = {
  all: ['users'] as const,
  list: (query: Partial<ListUsersQuery>) => ['users', 'list', query] as const,
  roles: ['roles'] as const,
};

export function useUsers(query: Partial<ListUsersQuery>) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: ({ signal }) => apiRequest<Paginated<UserDto>>('/users', { query, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: userKeys.roles,
    queryFn: () => apiRequest<RoleDto[]>('/roles'),
    staleTime: 5 * 60_000,
    enabled,
  });
}

function useUserMutation<TVariables>(fn: (variables: TVariables) => Promise<UserDto>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export const useCreateUser = () =>
  useUserMutation((input: CreateUserInput) =>
    apiRequest<UserDto>('/users', { method: 'POST', body: input }),
  );

export const useUpdateUser = () =>
  useUserMutation(({ id, input }: { id: string; input: UpdateUserInput }) =>
    apiRequest<UserDto>(`/users/${id}`, { method: 'PATCH', body: input }),
  );

export const useSetUserRoles = () =>
  useUserMutation(({ id, roleKeys }: { id: string; roleKeys: string[] }) =>
    apiRequest<UserDto>(`/users/${id}/roles`, { method: 'PUT', body: { roleKeys } }),
  );

export const useResetUserPassword = () =>
  useUserMutation(({ id, input }: { id: string; input: ResetUserPasswordInput }) =>
    apiRequest<UserDto>(`/users/${id}/reset-password`, { method: 'POST', body: input }),
  );
