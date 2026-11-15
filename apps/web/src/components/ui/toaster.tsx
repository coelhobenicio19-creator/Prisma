'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-surface border border-border text-text-primary',
          description: 'text-text-muted',
          actionButton: 'bg-accent-bg text-accent hover:bg-accent/20',
          cancelButton: 'bg-surface-hover text-text-primary hover:bg-surface-border',
        },
      }}
    />
  );
}