import {
  AUDIT_ACTION_LABELS,
  type AuditAction,
  type AuditLogDto,
  type Paginated,
} from '@skoolledger/shared';
import { Badge, Button, Card, NativeSelect } from '@skoolledger/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { apiRequest } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { AuditDetails } from './AuditDetails';

const PAGE_SIZE = 25;

function actionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
}

function actionVariant(action: string) {
  if (action === 'auth.login_failed' || action === 'auth.refresh_reuse_detected')
    return 'destructive';
  if (action.startsWith('auth.')) return 'secondary';
  return 'default';
}

const columns: ColumnDef<AuditLogDto, unknown>[] = [
  {
    id: 'expand',
    size: 40,
    header: () => <span className="sr-only">Details</span>,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={row.getToggleExpandedHandler()}
        aria-label={row.getIsExpanded() ? 'Hide details' : 'Show details'}
        aria-expanded={row.getIsExpanded()}
      >
        {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
      </Button>
    ),
  },
  {
    header: 'Date & time',
    cell: ({ row }) => (
      <span className="tabular whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    header: 'User',
    cell: ({ row }) =>
      row.original.actor ? (
        <div>
          <div className="font-medium">{row.original.actor.fullName}</div>
          <div className="text-xs text-muted-foreground">@{row.original.actor.username}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    header: 'Action',
    cell: ({ row }) => (
      <Badge variant={actionVariant(row.original.action)}>{actionLabel(row.original.action)}</Badge>
    ),
  },
  {
    header: 'Record',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.entity}
        {row.original.entityId && (
          <span className="ml-1 font-mono text-[11px]">#{row.original.entityId.slice(0, 8)}</span>
        )}
      </span>
    ),
  },
  {
    header: 'IP address',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.ipAddress ?? '—'}</span>,
  },
];

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const logs = useQuery({
    queryKey: ['audit-logs', { page, action }],
    queryFn: ({ signal }) =>
      apiRequest<Paginated<AuditLogDto>>('/audit-logs', {
        query: { page, pageSize: PAGE_SIZE, action: action || undefined },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="A permanent, tamper-resistant record of sign-ins and changes. Entries cannot be edited or deleted."
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <NativeSelect
            className="sm:w-64"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by action"
          >
            <option value="">All actions</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        {logs.isError ? (
          <div className="p-4">
            <ErrorState error={logs.error} onRetry={() => void logs.refetch()} />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={logs.data?.items ?? []}
              loading={logs.isLoading}
              getRowId={(row) => row.id}
              emptyMessage="No audit entries match this filter."
              renderExpanded={(row) => <AuditDetails entry={row.original} />}
            />
            {logs.data && (
              <Pagination
                page={logs.data.page}
                pageSize={logs.data.pageSize}
                total={logs.data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
