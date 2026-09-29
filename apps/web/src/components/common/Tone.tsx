import { cn } from '@skoolledger/ui';
import type { ReactNode } from 'react';

const TONES = {
  neutral: 'bg-[#edf1f5] text-[#526178]',
  success: 'bg-[#e7f4ee] text-[#247553]',
  warning: 'bg-[#fff3dc] text-[#94651c]',
  danger: 'bg-[#fce9e7] text-[#b34b43]',
  info: 'bg-[#e7eff9] text-[#335b8e]',
} as const;

export type Tone = keyof typeof TONES;

/** Rounded status pill. */
export function TonePill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
