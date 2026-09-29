import { FileBarChart } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { EmptyPreview } from '@/features/preview/EmptyPreview';
import { PendingModulePage } from '@/features/preview/PendingModulePage';

export function ReportsPage() {
  return (
    <PendingModulePage
      path="/reports"
      description="Turn fee, payroll, expense and operations data into clear management reports."
      hasSampleData={false}
    >
      <Panel>
        <EmptyPreview
          icon={FileBarChart}
          title="Reports workspace"
          text="Reports will be generated as PDF on the server once the finance modules they draw on are built."
        />
      </Panel>
    </PendingModulePage>
  );
}
