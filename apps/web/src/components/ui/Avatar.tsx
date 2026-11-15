import { forwardRef, HTMLAttributes, useMemo, Children, isValidElement, cloneElement, ReactElement } from 'react';
import { cn } from '@/utils/helpers';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-xl',
};

const STATUS_POSITIONS = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
};

const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      fallback,
      size = 'md',
      shape = 'circle',
      status,
      statusPosition = 'bottom-right',
      className,
      ...props
    },
    ref
  ) => {
    const initials = useMemo(() => fallback ? getInitials(fallback) : '?', [fallback]);
    const bgColor = useMemo(() => fallback ? getColorFromName(fallback) : 'bg-accent-bg', [fallback]);
    const textColor = useMemo(() => fallback ? 'text-white' : 'text-accent', [fallback]);
    
    const showFallback = !src || src.startsWith('data:');
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center overflow-hidden font-medium transition-colors relative',
          SIZE_CLASSES[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span className={cn('w-full h-full flex items-center justify-center', bgColor, textColor)}>
            {initials}
          </span>
        ) : (
          <img
            src={src}
            alt={alt || fallback || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        
        {status && (
          <span
            className={cn(
              'absolute w-2.5 h-2.5 rounded-full border-2 border-bg-primary',
              STATUS_COLORS[status],
              STATUS_POSITIONS[statusPosition]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarProps['size'];
  overlap?: boolean;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 5, size = 'md', overlap = true, children, className, ...props }, ref) => {
    const childrenArray = Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = childrenArray.length - max;
    
    return (
      <div
        ref={ref}
        className={cn('flex items-center', overlap && '-space-x-2', className)}
        {...props}
      >
        {visibleChildren.map((child, index) =>
          isValidElement(child) ? (
            cloneElement(child as ReactElement, {
              key: child.key || index,
              size,
              className: cn(
                'relative z-10 ring-2 ring-bg-primary',
                index === 0 && 'z-20'
              ),
            })
          ) : null
        )}
        
        {remainingCount > 0 && (
          <div
            className={cn(
              'inline-flex items-center justify-center font-medium ring-2 ring-bg-primary',
              SIZE_CLASSES[size],
              'rounded-full bg-surface-border text-text-muted',
              overlap ? '-ml-2' : 'ml-2'
            )}
            aria-label={`${remainingCount} mais`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';