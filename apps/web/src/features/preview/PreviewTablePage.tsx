import { Download, type LucideIcon, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { FilterBar } from '@/components/common/FilterBar';
import { Panel } from '@/components/common/Panel';
import { StatCard, type StatAccent } from '@/components/common/StatCard';
import { SimpleTable } from '@/components/tables/SimpleTable';
import { PendingButton, PendingModulePage } from './PendingModulePage';

export interface PreviewStat {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: StatAccent;
}

/** Standard pending-module screen: sample key figures plus a sample table. */
export function PreviewTablePage({
  path,
  description,
  addLabel = 'Add record',
  stats,
  filters,
  headers,
  rows,
}: {
  path: string;
  description: string;
  addLabel?: string;
  stats?: PreviewStat[];
  filters?: ReactNode;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <PendingModulePage
      path={path}
      description={description}
      actions={
        <>
          <PendingButton variant="outline">
            <Download /> Export
          </PendingButton>
          <PendingButton>
            <Plus /> {addLabel}
          </PendingButton>
        </>
      }
    >
      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} note="Sample" />
          ))}
        </div>
      )}
      <Panel>
        <FilterBar>{filters}</FilterBar>
        <SimpleTable caption="Sample records" headers={headers} rows={rows} />
      </Panel>
    </PendingModulePage>
  );
}
