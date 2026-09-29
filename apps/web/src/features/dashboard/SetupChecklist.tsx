import { PERMISSIONS, type Paginated, type UserDto } from '@skoolledger/shared';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  cn,
} from '@skoolledger/ui';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/features/auth/auth-context';
import { useSchoolSettings } from '@/features/settings/api';
import { apiRequest } from '@/lib/api-client';

interface ChecklistItem {
  label: string;
  done: boolean;
  to: string;
}

/** Real configuration progress, computed from saved settings and users. */
export function SetupChecklist() {
  const { can } = useAuth();
  const settings = useSchoolSettings();
  const canSeeUsers = can(PERMISSIONS.USERS_READ);
  const users = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => apiRequest<Paginated<UserDto>>('/users', { query: { pageSize: 1 } }),
    enabled: canSeeUsers,
  });

  if (settings.isError)
    return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />;

  const s = settings.data;
  const items: ChecklistItem[] = s
    ? [
        {
          label: 'School name and contact details',
          done: Boolean(s.schoolName && s.address && (s.phone || s.email)),
          to: '/settings',
        },
        { label: 'School logo uploaded', done: s.hasLogo, to: '/settings' },
        { label: 'Academic session set', done: Boolean(s.academicSession), to: '/settings' },
        {
          label: 'Bank or mobile wallet details for fee vouchers',
          done: Boolean((s.bankName && s.accountNumber) || s.iban || s.jazzCash || s.easypaisa),
          to: '/settings',
        },
        ...(canSeeUsers
          ? [
              {
                label: 'Staff user accounts created',
                done: (users.data?.total ?? 0) > 1,
                to: '/users',
              },
            ]
          : []),
      ]
    : [];

  const completed = items.filter((i) => i.done).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Setup checklist</CardTitle>
        <CardDescription>
          {s ? `${completed} of ${items.length} steps complete.` : 'Checking your configuration…'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settings.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-2/3" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2.5 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="size-4 text-success" aria-label="Done" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" aria-label="Not done" />
                  )}
                  <span className={cn(item.done && 'text-muted-foreground')}>{item.label}</span>
                </span>
                {!item.done && (
                  <Button asChild variant="link" size="sm" className="h-auto p-0">
                    <Link to={item.to}>Set up</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
