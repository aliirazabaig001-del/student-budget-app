import { AlertCircle, Boxes, Building2, CircleDollarSign } from 'lucide-react';
import { TonePill } from '@/components/common/Tone';
import { PreviewTablePage } from '@/features/preview/PreviewTablePage';
import { sampleInventory, sampleMoney } from '@/mocks/preview-data';

export function InventoryPage() {
  return (
    <PreviewTablePage
      path="/inventory"
      description="Track school supplies, reorder points and suppliers."
      addLabel="Add item"
      stats={[
        { label: 'Tracked items', value: '214', icon: Boxes },
        { label: 'Low stock', value: '14', icon: AlertCircle, accent: 'gold' },
        { label: 'Inventory value', value: 'PKR 2.84m', icon: CircleDollarSign },
        { label: 'Suppliers', value: '32', icon: Building2, accent: 'green' },
      ]}
      headers={['Item', 'Category', 'In stock', 'Reorder level', 'Supplier', 'Unit cost', 'Status']}
      rows={sampleInventory.map((i) => {
        const low = i.quantity < i.reorder;
        return [
          <span className="font-bold text-foreground">{i.item}</span>,
          i.category,
          <span className="font-bold">{i.quantity}</span>,
          i.reorder,
          i.supplier,
          sampleMoney(i.unit),
          <TonePill tone={low ? 'warning' : 'success'}>{low ? 'Reorder' : 'Healthy'}</TonePill>,
        ];
      })}
    />
  );
}
