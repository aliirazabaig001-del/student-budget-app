import { Button, type ButtonProps } from '@skoolledger/ui';
import { Construction } from 'lucide-react';
import type { ReactNode } from 'react';
import { PENDING_ITEMS } from '@/app/navigation';
import { PageHeader } from '@/components/PageHeader';

export const PENDING_LABEL = 'UI ready — backend module pending';

/**
 * Wrapper for module screens whose backend is not built yet. It labels the
 * page unmistakably and states that any figures shown are fictional samples,
 * so nobody mistakes the preview for real school records.
 */
export function PendingModulePage({
  path,
  description,
  actions,
  hasSampleData = true,
  children,
}: {
  /** The module's route in `navigation.ts`; supplies title and milestone. */
  path: string;
  description: string;
  actions?: ReactNode;
  /** False when the screen shows layout only, without sample rows. */
  hasSampleData?: boolean;
  children: ReactNode;
}) {
  const item = PENDING_ITEMS.find((entry) => entry.path === path);
  if (!item) throw new Error(`No pending module registered for ${path}`);
  const { milestone, summary } = item.pending;
  const title = item.label;

  return (
    <>
      <PageHeader
        eyebrow={`Milestone ${milestone} · Preview`}
        title={title}
        description={description}
        actions={actions}
      />
      <div
        role="status"
        className="mb-6 rounded-[10px] border border-[#e7d8b4] bg-[#fffaf0] px-4 py-3.5"
      >
        <div className="flex items-start gap-3">
          <Construction className="mt-0.5 size-4 shrink-0 text-[#bd852b]" aria-hidden />
          <div>
            <p className="text-[12px] font-bold text-[#634a1c]">{PENDING_LABEL}</p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-[#80683a]">
              {summary}{' '}
              {hasSampleData
                ? 'Figures below are fictional samples for layout review — they are not your school’s records, and nothing on this screen is saved.'
                : 'Nothing on this screen is saved yet.'}
            </p>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

/** An action button that is visibly present but disabled until the backend exists. */
export function PendingButton(props: Omit<ButtonProps, 'disabled'>) {
  return <Button {...props} disabled title={PENDING_LABEL} />;
}
