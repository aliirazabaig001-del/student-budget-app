import { cn } from '@skoolledger/ui';
import type { ReactNode } from 'react';

/** White bordered section with an optional titled header row. */
export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-[10px] border border-border bg-card shadow-[0_2px_8px_rgba(28,43,73,0.025)]',
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <h3 className="font-display text-[14px] font-extrabold text-foreground">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
