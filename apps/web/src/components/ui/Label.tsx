import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-text-secondary mb-1.5', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';
