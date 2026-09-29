import { BriefcaseBusiness, Check, Users, WalletCards } from 'lucide-react';
import { PreviewTablePage } from '@/features/preview/PreviewTablePage';
import { sampleMoney, sampleStaff } from '@/mocks/preview-data';

export function PayrollPage() {
  return (
    <PreviewTablePage
      path="/payroll"
      description="Prepare monthly payroll with transparent salary components, advances and deductions."
      addLabel="Run payroll"
      stats={[
        { label: 'Monthly payroll', value: 'PKR 4.18m', icon: BriefcaseBusiness },
        { label: 'Staff members', value: '86', icon: Users },
        { label: 'Advances outstanding', value: 'PKR 284k', icon: WalletCards, accent: 'gold' },
        { label: 'Payroll status', value: 'Ready', icon: Check, accent: 'green' },
      ]}
      headers={[
        'Staff member',
        'Role',
        'Base pay',
        'Allowances',
        'Deductions',
        'Advances',
        'Net salary',
      ]}
      rows={sampleStaff.map((s) => [
        <span className="font-bold text-foreground">{s.name}</span>,
        s.role,
        sampleMoney(s.base),
        sampleMoney(s.allowances),
        sampleMoney(s.deductions),
        sampleMoney(s.advances),
        <span className="font-bold text-foreground">{sampleMoney(s.net)}</span>,
      ])}
    />
  );
}
