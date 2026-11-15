import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', size = 'md', dot, dotColor, className, children, ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-accent-bg text-accent border-accent/20',
      success: 'bg-green-900/30 text-green-400 border-green-900/30',
      warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/30',
      error: 'bg-red-900/30 text-red-400 border-red-900/30',
      neutral: 'bg-surface-border text-text-muted border-border',
      outline: 'bg-transparent text-text-secondary border-border',
    };
    
    const sizeClasses = {
      sm: 'px-1.5 py-0.5 text-xs gap-1',
      md: 'px-2 py-0.5 text-xs gap-1.5',
      lg: 'px-2.5 py-1 text-sm gap-2',
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor || 'currentColor' }}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';