import { ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import { Panel } from '@/components/common/Panel';
import { Tabs } from '@/components/common/Tabs';
import { TonePill } from '@/components/common/Tone';
import { SimpleTable } from '@/components/tables/SimpleTable';
import { EmptyPreview } from '@/features/preview/EmptyPreview';
import { PendingButton, PendingModulePage } from '@/features/preview/PendingModulePage';
import { sampleFeeHeads, sampleMoney } from '@/mocks/preview-data';

const TABS = ['Fee heads', 'Fee structures', 'Monthly billing', 'Discounts', 'Arrears'] as const;

export function FeesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Fee heads');
  return (
    <PendingModulePage
      path="/fees"
      description="Configure the structures that power monthly billing, discounts and arrears."
      actions={
        <PendingButton>
          <Plus /> Add fee head
        </PendingButton>
      }
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <Panel title={tab}>
        {tab === 'Fee heads' ? (
          <SimpleTable
            caption="Sample fee heads"
            headers={['Fee head', 'Applies to', 'Amount', 'Frequency', 'Status']}
            rows={sampleFeeHeads.map((f) => [
              <span className="font-bold text-foreground">{f.name}</span>,
              f.className,
              <span className="font-bold text-foreground">{sampleMoney(f.amount)}</span>,
              f.frequency,
              <TonePill tone="success">Active</TonePill>,
            ])}
          />
        ) : (
          <EmptyPreview icon={ClipboardList} title={`${tab} workspace`} />
        )}
      </Panel>
    </PendingModulePage>
  );
}
