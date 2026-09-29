import { cn } from '@skoolledger/ui';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const ACCENTS = {
  navy: 'bg-[#e8eef7] text-[#31598a]',
  gold: 'bg-[#fff2d8] text-[#a4711e]',
  green: 'bg-[#e6f4ed] text-[#27805d]',
  red: 'bg-[#fce9e7] text-[#b34b43]',
} as const;

export type StatAccent = keyof typeof ACCENTS;

/** Key-figure tile. `value` may be a placeholder when no data is connected. */
export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  accent = 'navy',
  muted = false,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon: LucideIcon;
  accent?: StatAccent;
  /** Render the value greyed out (no live data). */
  muted?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-card p-4 shadow-[0_2px_8px_rgba(28,43,73,0.025)]">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('grid size-9 place-items-center rounded-[8px]', ACCENTS[accent])}>
          <Icon className="size-[17px]" aria-hidden />
        </span>
        {note && (
          <span className="text-right text-[11px] font-bold text-muted-foreground">{note}</span>
        )}
      </div>
      <p className="mt-4 text-[12px] font-semibold text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 font-display text-[23px] font-extrabold tracking-[-0.04em] tabular',
          muted ? 'text-muted-foreground/50' : 'text-primary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
