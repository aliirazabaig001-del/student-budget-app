import { AlertCircle, Check, CircleDollarSign, GraduationCap, Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterBar, FilterSelect } from '@/components/common/FilterBar';
import { Panel } from '@/components/common/Panel';
import { StatCard } from '@/components/common/StatCard';
import { TonePill } from '@/components/common/Tone';
import { SimpleTable } from '@/components/tables/SimpleTable';
import { PendingButton, PendingModulePage } from '@/features/preview/PendingModulePage';
import { initials } from '@/lib/format';
import { sampleMoney, sampleStudents } from '@/mocks/preview-data';

export function StudentsPage() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sampleStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.admission.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <PendingModulePage
      path="/students"
      description="Maintain student records, contact details, status and fee standing in one place."
      actions={
        <>
          <PendingButton variant="outline">
            <Upload /> Import from Excel
          </PendingButton>
          <PendingButton>
            <Plus /> Add student
          </PendingButton>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total students" value="1,248" note="Sample" icon={GraduationCap} />
        <StatCard label="Active" value="1,219" note="Sample" icon={Check} accent="green" />
        <StatCard label="On hold" value="29" note="Sample" icon={AlertCircle} accent="gold" />
        <StatCard
          label="With balance"
          value="184"
          note="Sample"
          icon={CircleDollarSign}
          accent="red"
        />
      </div>
      <Panel>
        <FilterBar search={query} onSearch={setQuery} placeholder="Search name or admission no.">
          <FilterSelect label="Class" options={['All classes', 'Grade 8', 'Grade 9']} />
          <FilterSelect label="Status" options={['All statuses', 'Active', 'On hold']} />
        </FilterBar>
        <div className="border-b border-border/70 px-5 py-3 text-[11px] text-[#8895a6]">
          <span className="font-bold text-foreground">{rows.length} shown</span> · Sample student
          records
        </div>
        <SimpleTable
          caption="Sample student records"
          headers={[
            'Student',
            'Admission / GR no.',
            'Class',
            'Guardian',
            'Phone',
            'Fee balance',
            'Status',
          ]}
          rows={rows.map((s) => [
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-full bg-[#edf1f5] text-[9px] font-bold text-[#526178]">
                {initials(s.name)}
              </span>
              <span className="font-bold text-foreground">{s.name}</span>
            </div>,
            <span className="font-mono text-[11px]">{s.admission}</span>,
            <span>
              {s.className} <span className="text-[#9aa6b6]">· {s.section}</span>
            </span>,
            s.guardian,
            s.phone,
            <span
              className={s.balance > 0 ? 'font-bold text-destructive' : 'font-bold text-success'}
            >
              {s.balance ? sampleMoney(s.balance) : 'Clear'}
            </span>,
            <TonePill tone={s.status === 'Active' ? 'success' : 'warning'}>{s.status}</TonePill>,
          ])}
        />
      </Panel>
    </PendingModulePage>
  );
}
