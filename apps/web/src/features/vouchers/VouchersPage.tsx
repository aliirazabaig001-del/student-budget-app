import { cn } from '@skoolledger/ui';
import { Download, FileCheck2, FilePlus2, Printer, SlidersHorizontal } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { FilterSelect } from '@/components/common/FilterBar';
import { Panel } from '@/components/common/Panel';
import { Tabs } from '@/components/common/Tabs';
import { EmptyPreview } from '@/features/preview/EmptyPreview';
import { PendingButton, PendingModulePage } from '@/features/preview/PendingModulePage';
import { useBranding } from '@/features/settings/api';
import { sampleVouchers } from '@/mocks/preview-data';
import { VoucherPreview } from './VoucherPreview';

const TABS = ['Generate', 'Voucher register', 'Templates'] as const;

export function VouchersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Generate');
  const [selected, setSelected] = useState(sampleVouchers[0]!);
  const { data: branding } = useBranding();

  return (
    <PendingModulePage
      path="/vouchers"
      description="Create, review and print monthly fee vouchers with a print-ready preview."
      actions={
        <>
          <PendingButton variant="outline">
            <Printer /> Print
          </PendingButton>
          <PendingButton>
            <FilePlus2 /> Generate vouchers
          </PendingButton>
        </>
      }
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab !== 'Generate' ? (
        <Panel title={tab}>
          <EmptyPreview icon={FileCheck2} title={`${tab} is ready for backend connection`} />
        </Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.93fr_1.07fr]">
          <Panel title="Generation settings">
            <div className="space-y-5 p-5">
              <Setting label="Billing month">
                <FilterSelect label="Billing month" options={['March', 'April']} />
              </Setting>
              <Setting label="Class and section">
                <FilterSelect
                  label="Class and section"
                  options={['Grade 8 — Section A', 'Grade 7 — Section B']}
                />
              </Setting>
              <div className="rounded-[8px] border border-[#e7d8b4] bg-[#fffaf0] p-3.5">
                <div className="flex gap-2.5">
                  <SlidersHorizontal className="mt-0.5 size-4 text-[#a87522]" aria-hidden />
                  <div>
                    <p className="text-[11px] font-bold text-[#634a1c]">
                      Arrears and discounts included
                    </p>
                    <p className="mt-1 text-[10.5px] leading-4 text-[#80683a]">
                      Existing balances and approved discounts will be calculated into each voucher
                      automatically.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-4">
                <p className="text-[11px] font-bold text-foreground">Whole class</p>
                <PendingButton variant="secondary">
                  <FilePlus2 /> Generate whole class
                </PendingButton>
              </div>
            </div>
          </Panel>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-warning">
                Layout preview
              </p>
              <PendingButton variant="outline" size="sm">
                <Download /> PDF
              </PendingButton>
            </div>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {sampleVouchers.map((v) => (
                <button
                  key={v.number}
                  type="button"
                  onClick={() => setSelected(v)}
                  className={cn(
                    'min-w-[148px] rounded-[7px] border px-3 py-2 text-left',
                    selected.number === v.number
                      ? 'border-[#c89942] bg-brand-gold-soft'
                      : 'border-border bg-card',
                  )}
                >
                  <p className="truncate text-[11px] font-bold text-foreground">{v.student}</p>
                  <p className="mt-1 text-[10px] text-[#8995a6]">{v.number}</p>
                </button>
              ))}
            </div>
            <VoucherPreview voucher={selected} schoolName={branding?.schoolName ?? 'Your school'} />
          </div>
        </div>
      )}
    </PendingModulePage>
  );
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold text-[#526178]">{label}</p>
      {children}
    </div>
  );
}
