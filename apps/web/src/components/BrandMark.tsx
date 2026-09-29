import { APP_NAME, APP_TAGLINE } from '@skoolledger/shared';
import { cn } from '@skoolledger/ui';

/** The SkoolLedger logo mark: three ledger lines, the last one in gold. */
export function LogoGlyph({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-9 shrink-0', className)}>
      <rect width="32" height="32" rx="9" fill={inverted ? '#f2b84b' : '#1c2b49'} />
      <rect x="8" y="8" width="16" height="3" rx="1.5" fill={inverted ? '#18243b' : '#fff'} />
      <rect
        x="8"
        y="14.5"
        width="16"
        height="3"
        rx="1.5"
        fill={inverted ? '#18243b' : '#fff'}
        opacity=".7"
      />
      <rect x="8" y="21" width="9" height="3" rx="1.5" fill={inverted ? '#fff' : '#f2b84b'} />
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
      <LogoGlyph inverted={inverted} />
      <div className="leading-none">
        <div
          className={cn(
            'font-display text-[17px] font-extrabold tracking-[-0.04em]',
            inverted ? 'text-white' : 'text-primary',
          )}
        >
          {APP_NAME}
        </div>
        {showTagline && (
          <div
            className={cn(
              'mt-1 text-[9px] font-semibold uppercase leading-[1.35] tracking-[0.06em]',
              inverted ? 'text-sidebar-foreground' : 'text-muted-foreground',
            )}
          >
            {APP_TAGLINE}
          </div>
        )}
      </div>
    </div>
  );
}
