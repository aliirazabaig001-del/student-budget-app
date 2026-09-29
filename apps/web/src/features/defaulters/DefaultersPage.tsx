import { Activity, AlertCircle, CircleDollarSign, TrendingUp } from 'lucide-react';
import { FilterSelect } from '@/components/common/FilterBar';
import { TonePill } from '@/components/common/Tone';
import { PreviewTablePage } from '@/features/preview/PreviewTablePage';
import { sampleDefaulters, sampleMoney } from '@/mocks/preview-data';

export function DefaultersPage() {
  return (
    <PreviewTablePage
      path="/defaulters"
      description="Prioritise follow-ups with a clear view of overdue balances and collection risk."
      addLabel="Log follow-up"
      stats={[
        { label: 'Students overdue', value: '184', icon: AlertCircle, accent: 'red' },
        { label: 'Total overdue', value: 'PKR 1.26m', icon: CircleDollarSign, accent: 'gold' },
        { label: 'High risk', value: '32', icon: Activity, accent: 'red' },
        { label: 'Recovered this week', value: 'PKR 184k', icon: TrendingUp, accent: 'green' },
      ]}
      filters={
        <FilterSelect label="Risk" options={['All risk levels', 'High risk', 'Follow up']} />
      }
      headers={[
        'Student',
        'Class',
        'Guardian',
        'Phone',
        'Amount due',
        'Last payment',
        'Overdue',
        'Status',
      ]}
      rows={sampleDefaulters.map((d) => [
        <span className="font-bold text-foreground">{d.student}</span>,
        d.className,
        d.guardian,
        d.phone,
        <span className="font-bold text-destructive">{sampleMoney(d.due)}</span>,
        d.lastPayment,
        `${d.days} days`,
        <TonePill
          tone={
            d.status === 'High risk' ? 'danger' : d.status === 'Follow up' ? 'warning' : 'neutral'
          }
        >
          {d.status}
        </TonePill>,
      ])}
    />
  );
}
