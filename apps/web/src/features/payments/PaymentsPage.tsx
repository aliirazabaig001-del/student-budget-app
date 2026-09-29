import { AlertCircle, Check, CircleDollarSign, Receipt } from 'lucide-react';
import { FilterSelect } from '@/components/common/FilterBar';
import { TonePill } from '@/components/common/Tone';
import { PreviewTablePage } from '@/features/preview/PreviewTablePage';
import { sampleMoney, samplePayments } from '@/mocks/preview-data';

export function PaymentsPage() {
  return (
    <PreviewTablePage
      path="/payments"
      description="Record collections, review payment history and keep receipts tied to vouchers."
      addLabel="Enter payment"
      stats={[
        {
          label: 'Collected this month',
          value: 'PKR 2.94m',
          icon: CircleDollarSign,
          accent: 'green',
        },
        { label: 'Vouchers issued', value: '1,248', icon: Receipt },
        { label: 'Paid in full', value: '1,064', icon: Check, accent: 'green' },
        { label: 'Balance remaining', value: 'PKR 1.26m', icon: AlertCircle, accent: 'red' },
      ]}
      filters={<FilterSelect label="Method" options={['All methods', 'Bank transfer', 'Cash']} />}
      headers={['Student', 'Voucher', 'Amount paid', 'Date', 'Method', 'Reference', 'Status']}
      rows={samplePayments.map((p) => [
        <span className="font-bold text-foreground">{p.student}</span>,
        <span className="font-mono text-[11px]">{p.invoice}</span>,
        <span className="font-bold text-success">{sampleMoney(p.amount)}</span>,
        p.date,
        p.method,
        <span className="font-mono text-[11px]">{p.reference}</span>,
        <TonePill tone="success">Posted</TonePill>,
      ])}
    />
  );
}
