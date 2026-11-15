import { forwardRef, HTMLAttributes, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { cn } from '@/utils/helpers';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  scrollHideDelay?: number;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, scrollHideDelay = 1500, ...props }, ref) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [showScrollbar, setShowScrollbar] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    
    useImperativeHandle(ref, () => scrollAreaRef.current!, []);
    
    const show = () => {
      setShowScrollbar(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        if (!isHovered) setShowScrollbar(false);
      }, scrollHideDelay);
    };
    
    const hide = () => {
      if (!isHovered) setShowScrollbar(false);
    };
    
    useEffect(() => {
      const element = scrollAreaRef.current;
      if (!element) return;
      
      element.addEventListener('mouseenter', () => {
        setIsHovered(true);
        show();
      });
      
      element.addEventListener('mouseleave', () => {
        setIsHovered(false);
        hide();
      });
      
      element.addEventListener('wheel', show, { passive: true });
      element.addEventListener('scroll', show, { passive: true });
      
      return () => {
        element.removeEventListener('mouseenter', show);
        element.removeEventListener('mouseleave', hide);
        element.removeEventListener('wheel', show);
        element.removeEventListener('scroll', show);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, [isHovered, scrollHideDelay]);
    
    return (
      <div
        ref={scrollAreaRef}
        className={cn(
          'relative overflow-y-auto',
          showScrollbar ? 'scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent' : 'scrollbar-hide',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export interface ScrollBarProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
}

export const ScrollBar = forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex touch-none select-none transition-opacity',
        orientation === 'vertical' ? 'h-full w-1.5' : 'w-full h-1.5',
        className
      )}
      {...props}
    />
  )
);

ScrollBar.displayName = 'ScrollBar';

export const ScrollThumb = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' }>(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-full bg-border-light/50 hover:bg-border-light active:bg-text-muted transition-colors',
        orientation === 'vertical' ? 'w-full min-h-20' : 'h-full min-w-20',
        className
      )}
      {...props}
    />
  )
);

ScrollThumb.displayName = 'ScrollThumb';