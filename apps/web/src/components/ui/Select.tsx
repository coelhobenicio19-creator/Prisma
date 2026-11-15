import { forwardRef, SelectHTMLAttributes, useId, useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/helpers';
import { Badge } from './Badge';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, options, onChange, fullWidth = false, className, id, ...props }, ref) => {
    const selectId = useId();
    const generatedId = id || selectId;
    const errorId = `${generatedId}-error`;
    const hintId = `${generatedId}-hint`;
    
    return (
      <div className={cn('w-full', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={generatedId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={generatedId}
            className={cn('input appearance-none bg-no-repeat bg-right pr-10', error && 'border-error focus:border-error focus:ring-error/20', className)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface MultiSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  fullWidth?: boolean;
  maxDisplay?: number;
}

export function MultiSelect({ label, error, hint, placeholder, options, value, onChange, fullWidth = false, maxDisplay = 3 }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    );
  };
  
  const displayedValues = value.slice(0, maxDisplay);
  const remainingCount = value.length - maxDisplay;
  
  return (
    <div className={cn('w-full', fullWidth && 'w-full')}>
      {label && (
        <label className="label">{label}</label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className={cn('input appearance-none bg-no-repeat bg-right pr-10 text-left', error && 'border-error focus:border-error focus:ring-error/20')}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex flex-wrap items-center gap-1.5 min-h-[40px]">
            {displayedValues.length > 0 ? (
              displayedValues.map((v) => {
                const option = options.find((o) => o.value === v);
                return (
                  <Badge key={v} variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); toggle(v); }}>
                    {option?.label || v}
                    <button type="button" className="ml-1 p-0.5 hover:bg-black/10 rounded" onClick={(e) => { e.stopPropagation(); toggle(v); }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </Badge>
                );
              })
            ) : (
              <span className="text-text-muted">{placeholder || 'Selecione...'}</span>
            )}
            {remainingCount > 0 && (
              <Badge variant="neutral" size="sm">+{remainingCount}</Badge>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
            <svg className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-surface border border-border rounded-lg shadow-lg animate-fade-in">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition-colors',
                  value.includes(option.value)
                    ? 'bg-accent-bg text-accent'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => { if (!option.disabled) toggle(option.value); }}
                disabled={option.disabled}
                role="option"
                aria-selected={value.includes(option.value)}
              >
                <div className="flex items-center gap-2">
                  {value.includes(option.value) && (
                    <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-text-muted">{hint}</p>}
    </div>
  );
}

MultiSelect.displayName = 'MultiSelect';