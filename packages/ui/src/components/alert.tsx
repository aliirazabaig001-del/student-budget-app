import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/cn';

const alertVariants = cva(
  'flex gap-3 rounded-md border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        info: 'border-primary/20 bg-primary/5 text-foreground [&>svg]:text-primary',
        success: 'border-success/25 bg-success/5 text-foreground [&>svg]:text-success',
        warning: 'border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning-foreground',
        destructive:
          'border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  destructive: AlertCircle,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? 'info'];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-medium leading-tight">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
}
