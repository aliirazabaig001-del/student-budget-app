import { PERMISSIONS, type HealthDto } from '@skoolledger/shared';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@skoolledger/ui';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Boxes,
  CircleDollarSign,
  HandCoins,
  type LucideIcon,
  Receipt,
  WalletCards,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { StatCard, type StatAccent } from '@/components/common/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { useAuth, useCurrentUser } from '@/features/auth/auth-context';
import { apiRequest } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { SetupChecklist } from './SetupChecklist';

interface MetricPlaceholder {
  label: string;
  icon: LucideIcon;
  milestone: number;
  accent: StatAccent;
}

/**
 * Finance modules do not exist yet, so these cards deliberately show no
 * numbers. Each will be wired to real data by the milestone noted on it.
 */
const METRICS: MetricPlaceholder[] = [
  { label: 'Fees Collected', icon: HandCoins, milestone: 6, accent: 'green' },
  { label: 'Outstanding Fees', icon: Receipt, milestone: 7, accent: 'red' },
  { label: 'Salaries', icon: WalletCards, milestone: 8, accent: 'gold' },
  { label: 'Expenses', icon: CircleDollarSign, milestone: 9, accent: 'gold' },
  { label: 'Inventory Value', icon: Boxes, milestone: 10, accent: 'navy' },
  { label: 'Cash Balance', icon: Banknote, milestone: 9, accent: 'navy' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const user = useCurrentUser();
  const { can } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())}
        title={`${greeting()}, ${user.fullName.split(' ')[0]}`}
        description="Overview of your school's finances and operations."
      />

      <Alert variant="info" title="Finance modules are not connected yet" className="mb-6">
        These figures will appear automatically once the Fees, Payroll, Expenses, Inventory and
        Accounts modules are installed in upcoming milestones. No sample numbers are shown.
      </Alert>

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {METRICS.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={<span aria-label="No data">—</span>}
            muted
            icon={metric.icon}
            accent={metric.accent}
            note={`Not connected · Milestone ${metric.milestone}`}
          />
        ))}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {can(PERMISSIONS.SETTINGS_READ) && (
          <div className="lg:col-span-2">
            <SetupChecklist />
          </div>
        )}
        <SystemStatusCard />
      </div>
    </>
  );
}

function SystemStatusCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiRequest<HealthDto>('/health'),
    refetchInterval: 60_000,
  });

  const rows: [string, ReactNode][] = [
    [
      'Server',
      isError ? (
        <Badge variant="destructive">Unreachable</Badge>
      ) : (
        <Badge variant="success">Online</Badge>
      ),
    ],
    [
      'Database',
      data?.database === 'up' ? (
        <Badge variant="success">Connected</Badge>
      ) : (
        <Badge variant="destructive">Unavailable</Badge>
      ),
    ],
    ['Version', <span className="tabular">{data?.version ?? '—'}</span>],
    ['Checked', <span className="tabular">{formatDateTime(data?.time)}</span>],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System status</CardTitle>
        <CardDescription>Live status of this SkoolLedger installation.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <dl className="divide-y divide-border text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
