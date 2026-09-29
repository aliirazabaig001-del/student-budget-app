import { APP_NAME, APP_TAGLINE } from '@skoolledger/shared';
import { cn } from '@skoolledger/ui';

/** The SkoolLedger logo mark: three ledger lines, the last one in gold. */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="7" fill="#1e3a5f" />
      <rect x="8" y="8" width="16" height="3" rx="1.5" fill="#fff" />
      <rect x="8" y="14.5" width="16" height="3" rx="1.5" fill="#fff" opacity=".75" />
      <rect x="8" y="21" width="9" height="3" rx="1.5" fill="#d9a441" />
    </svg>
  );
}

export function BrandMark({
  inverted = false,
  showTagline = true,
  className,
}: {
  inverted?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoGlyph className={inverted ? 'ring-1 ring-white/10 rounded-[7px]' : undefined} />
      <div className="leading-tight">
        <div
          className={cn(
            'text-base font-semibold tracking-tight',
            inverted ? 'text-white' : 'text-foreground',
          )}
        >
          {APP_NAME}
        </div>
        {showTagline && (
          <div
            className={cn(
              'whitespace-nowrap text-[10.5px]',
              inverted ? 'text-sidebar-muted' : 'text-muted-foreground',
            )}
          >
            {APP_TAGLINE}
          </div>
        )}
      </div>
    </div>
  );
}
