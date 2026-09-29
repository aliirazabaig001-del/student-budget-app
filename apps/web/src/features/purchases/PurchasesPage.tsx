import { TonePill } from '@/components/common/Tone';
import { PreviewTablePage } from '@/features/preview/PreviewTablePage';
import { sampleMoney, samplePurchases } from '@/mocks/preview-data';

export function PurchasesPage() {
  return (
    <PreviewTablePage
      path="/purchases"
      description="Review purchase orders, supplier balances and what is still due."
      addLabel="New purchase order"
      headers={['Supplier', 'Purchase order', 'Date', 'Order total', 'Paid', 'Balance', 'Status']}
      rows={samplePurchases.map((p) => {
        const balance = p.total - p.paid;
        return [
          <span className="font-bold text-foreground">{p.supplier}</span>,
          <span className="font-mono text-[11px]">{p.order}</span>,
          p.date,
          sampleMoney(p.total),
          sampleMoney(p.paid),
          <span className={balance > 0 ? 'font-bold text-destructive' : 'font-bold text-success'}>
            {sampleMoney(balance)}
          </span>,
          <TonePill
            tone={p.status === 'Paid' ? 'success' : p.status === 'Due' ? 'danger' : 'warning'}
          >
            {p.status}
          </TonePill>,
        ];
      })}
    />
  );
}
