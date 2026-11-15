// ============================================================
// Exportação client-side (R$ 0, sem dependências pesadas)
// Formatos: JSON (backup), Markdown, HTML salvo como .doc (abre no Word),
// e PDF via window.print() com CSS de impressão.
// Funções puras (toMarkdown/toJson/toHtml) são testáveis em node.
// ============================================================

export interface ExportableDoc {
  title: string;
  content?: string;
  tags?: string[];
  created_at?: string;
}

export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function toMarkdown(docs: ExportableDoc[]): string {
  const lines: string[] = ['# PRISMA — Exportação da Biblioteca', ''];
  for (const d of docs) {
    lines.push(`## ${d.title}`, '');
    if (d.tags?.length) lines.push(`*tags:* ${d.tags.join(', ')}`, '');
    if (d.created_at) lines.push(`*criado em:* ${d.created_at}`, '');
    if (d.content) lines.push(d.content, '');
    lines.push('---', '');
  }
  return lines.join('\n');
}

export function toHtmlDoc(title: string, bodyHtml: string): string {
  // HTML com header XML — o Word abre arquivos .doc que são HTML puro.
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${escapeXml(title)}</title></head>
<body style="font-family: Calibri, sans-serif; font-size: 11pt;">${bodyHtml}</body>
</html>`;
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function docsToHtmlBody(docs: ExportableDoc[]): string {
  return docs
    .map((d) => `<h1>${escapeXml(d.title)}</h1>${d.content ? `<p>${escapeXml(d.content).replace(/\n/g, '<br>')}</p>` : ''}`)
    .join('\n');
}

/** Faz download de um arquivo texto no navegador. */
export function download(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** PDF via diálogo de impressão do navegador (print CSS). */
export function printAsPdf(title: string, bodyHtml: string): void {
  const w = window.open('', '_blank', 'width=800,height=1000');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeXml(title)}</title>
<style>@page{margin:2cm} body{font-family:Georgia,serif;font-size:12pt;line-height:1.5} h1{font-size:18pt}</style>
</head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export const EXPORT_FORMATS = ['json', 'md', 'doc', 'pdf'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export function exportDocs(docs: ExportableDoc[], format: ExportFormat): void {
  const stamp = new Date().toISOString().slice(0, 10);
  switch (format) {
    case 'json':
      download(`prisma-export-${stamp}.json`, toJson(docs), 'application/json');
      break;
    case 'md':
      download(`prisma-export-${stamp}.md`, toMarkdown(docs), 'text/markdown');
      break;
    case 'doc':
      download(`prisma-export-${stamp}.doc`, toHtmlDoc('PRISMA Export', docsToHtmlBody(docs)), 'application/msword');
      break;
    case 'pdf':
      printAsPdf('PRISMA Export', docsToHtmlBody(docs));
      break;
  }
}
