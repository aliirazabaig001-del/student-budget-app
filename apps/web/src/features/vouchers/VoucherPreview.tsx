import type { SampleVoucher } from '@/mocks/preview-data';
import { sampleMoney } from '@/mocks/preview-data';

/**
 * On-screen voucher layout. When the Vouchers module is built, the same design
 * will be rendered to PDF by the API (HTML/CSS + Puppeteer); this component is
 * the visual reference for that template.
 */
export function VoucherPreview({
  voucher,
  schoolName,
}: {
  voucher: SampleVoucher;
  schoolName: string;
}) {
  const lines: [string, number, string?][] = [
    ['Tuition fee', voucher.tuition],
    ['Transport', voucher.transport],
    ['Previous balance', voucher.arrears, 'text-destructive'],
  ];
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-[#d7dee8] bg-white shadow-[0_6px_18px_rgba(28,43,73,0.06)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center text-[64px] font-extrabold tracking-widest text-[#1c2b49]/5"
      >
        SAMPLE
      </div>
      <div className="border-b-[3px] border-brand-gold bg-primary px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#f2cf87]">
              {schoolName}
            </p>
            <h3 className="mt-1 font-display text-[17px] font-extrabold">Fee payment voucher</h3>
          </div>
          <div className="text-right text-[10px] text-[#c6d1df]">
            <p className="font-mono text-[11px] text-white">{voucher.number}</p>
            <p className="mt-1">{voucher.month}</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-y-3 border-b border-dashed border-[#dfe4eb] pb-4 text-[11px]">
          <Field label="Student" value={voucher.student} />
          <Field label="Class / section" value={voucher.className} />
          <Field label="Due date" value={voucher.dueDate} />
          <Field label="Payment status" value="Unpaid" />
        </div>
        <div className="my-4 space-y-2 text-[11px]">
          {lines.map(([label, amount, tone]) => (
            <div key={label} className="flex justify-between">
              <span className="text-[#66758a]">{label}</span>
              <span className={tone ?? 'font-semibold text-foreground'}>{sampleMoney(amount)}</span>
            </div>
          ))}
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-semibold">− {sampleMoney(voucher.discount)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-[6px] bg-[#f5f7fa] px-3 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#526178]">
            Total payable
          </span>
          <span className="font-display text-[19px] font-extrabold text-primary tabular">
            {sampleMoney(voucher.total)}
          </span>
        </div>
        <p className="mt-4 text-center text-[9px] text-[#9aa6b6]">
          Sample layout only — not a valid voucher.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[#8995a6]">{label}</p>
      <p className="mt-0.5 font-bold text-foreground">{value}</p>
    </div>
  );
}
