import { Building2, CircleDollarSign, Download, TrendingUp } from 'lucide-react';
import { ChartLegend, TrendAreaChart, type SeriesDef } from '@/components/charts/Charts';
import { Panel } from '@/components/common/Panel';
import { StatCard } from '@/components/common/StatCard';
import { PendingButton, PendingModulePage } from '@/features/preview/PendingModulePage';
import { sampleCashMovement, sampleMoney, samplePayments } from '@/mocks/preview-data';

const SERIES: SeriesDef[] = [
  { key: 'income', label: 'Income (m)', color: '#1c2b49' },
  { key: 'expenses', label: 'Expenses (m)', color: '#e1a53e' },
];

export function AccountsPage() {
  return (
    <PendingModulePage
      path="/accounts"
      description="A composed view of cash movement, account activity and school operating health."
      actions={
        <PendingButton variant="outline">
          <Download /> Export statement
        </PendingButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cash at bank" value="PKR 8.42m" note="Sample" icon={Building2} />
        <StatCard
          label="Receivables"
          value="PKR 1.26m"
          note="Sample"
          icon={CircleDollarSign}
          accent="gold"
        />
        <StatCard
          label="Net position"
          value="PKR 1.82m"
          note="Sample"
          icon={TrendingUp}
          accent="green"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Cash movement (sample)" action={<ChartLegend series={SERIES} />}>
          <TrendAreaChart data={sampleCashMovement} xKey="month" series={SERIES} />
        </Panel>
        <Panel title="Account activity (sample)">
          <div className="divide-y divide-[#eef1f4]">
            {samplePayments.map((p) => (
              <div key={p.reference} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[11px] font-bold text-foreground">{p.student}</p>
                  <p className="mt-1 text-[10px] text-[#8995a6]">
                    {p.method} · {p.date}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-success tabular">
                  + {sampleMoney(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PendingModulePage>
  );
}
