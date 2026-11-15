import { useState } from 'react';
import { exportDocs, EXPORT_FORMATS, ExportFormat, ExportableDoc } from '@/services/export';

interface Props {
  docs: ExportableDoc[];
  className?: string;
}

export function ExportMenu({ docs, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className ?? ''}`}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)} aria-label="Exportar">
        Exportar ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-surface border border-border rounded-md shadow-lg z-30 py-1">
          {EXPORT_FORMATS.map((f: ExportFormat) => (
            <button
              key={f}
              className="block w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary"
              onClick={() => { exportDocs(docs, f); setOpen(false); }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
