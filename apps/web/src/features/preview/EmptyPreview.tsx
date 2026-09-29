import type { LucideIcon } from 'lucide-react';

/** Empty state for a designed view whose data source is not connected yet. */
export function EmptyPreview({
  icon: Icon,
  title,
  text = 'This view is designed and will show live records once its backend module is connected.',
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
}) {
  return (
    <div className="p-12 text-center">
      <Icon className="mx-auto size-8 text-[#abb6c4]" strokeWidth={1.5} aria-hidden />
      <p className="mt-3 text-[13px] font-bold text-[#526178]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
