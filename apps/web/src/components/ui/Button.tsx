import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from '@/utils/helpers';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-accent text-text-inverse hover:bg-accent-hover active:bg-accent/80',
      secondary: 'bg-surface text-text-primary border border-border hover:bg-surface-hover active:bg-surface-active',
      ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-active',
      danger: 'bg-error text-text-inverse hover:bg-error/90 active:bg-error',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      icon: 'p-2',
    };
    
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <Slottable>{children}</Slottable>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';