import { AlertCircle, Building2, Calculator, TrendingUp } from 'lucide-react';
import { TonePill } from '@/components/common/Tone';
import { PreviewTablePage } from '@/features/preview/PreviewTablePage';
import { sampleExpenses, sampleMoney } from '@/mocks/preview-data';

export function ExpensesPage() {
  return (
    <PreviewTablePage
      path="/expenses"
      description="Record operating spend and keep vendor payments visible against the school budget."
      addLabel="Add expense"
      stats={[
        { label: 'Expenses this month', value: 'PKR 1.04m', icon: Calculator, accent: 'gold' },
        { label: 'Pending review', value: '12', icon: AlertCircle, accent: 'red' },
        { label: 'Vendors', value: '48', icon: Building2 },
        { label: 'Budget used', value: '62.8%', icon: TrendingUp, accent: 'green' },
      ]}
      headers={['Category', 'Vendor', 'Date', 'Amount', 'Payment method', 'Status']}
      rows={sampleExpenses.map((e) => [
        <span className="font-bold text-foreground">{e.category}</span>,
        e.vendor,
        e.date,
        <span className="font-bold text-foreground">{sampleMoney(e.amount)}</span>,
        e.method,
        <TonePill tone="success">Posted</TonePill>,
      ])}
    />
  );
}
