import { cn } from '@skoolledger/ui';

/** Underlined tab strip (visual tabs; the caller renders the active panel). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly T[];
  value: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === value}
          onClick={() => onChange(tab)}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-4 pb-3 text-[12px] font-bold transition-colors',
            tab === value
              ? 'border-brand-gold text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
