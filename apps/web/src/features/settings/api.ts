import type {
  PublicBrandingDto,
  SchoolSettingsDto,
  SchoolSettingsInput,
} from '@skoolledger/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE, apiRequest } from '@/lib/api-client';

export const settingsKeys = {
  school: ['settings', 'school'] as const,
  branding: ['branding'] as const,
};

export function useBranding() {
  return useQuery({
    queryKey: settingsKeys.branding,
    queryFn: () => apiRequest<PublicBrandingDto>('/public/branding'),
    staleTime: 5 * 60_000,
  });
}

/** Cache-busting URL so a newly uploaded logo shows immediately. */
export function logoUrl(logoUpdatedAt: string | null): string {
  return `${API_BASE}/public/branding/logo?v=${encodeURIComponent(logoUpdatedAt ?? '')}`;
}

export function useSchoolSettings() {
  return useQuery({
    queryKey: settingsKeys.school,
    queryFn: () => apiRequest<SchoolSettingsDto>('/settings/school'),
  });
}

function useSettingsMutation<TVariables>(
  fn: (variables: TVariables) => Promise<SchoolSettingsDto>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.school, data);
      void queryClient.invalidateQueries({ queryKey: settingsKeys.branding });
    },
  });
}

export function useUpdateSchoolSettings() {
  return useSettingsMutation((input: SchoolSettingsInput) =>
    apiRequest<SchoolSettingsDto>('/settings/school', { method: 'PUT', body: input }),
  );
}

export function useUploadLogo() {
  return useSettingsMutation((file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest<SchoolSettingsDto>('/settings/school/logo', { method: 'POST', body: form });
  });
}

export function useRemoveLogo() {
  return useSettingsMutation(() =>
    apiRequest<SchoolSettingsDto>('/settings/school/logo', { method: 'DELETE' }),
  );
}
