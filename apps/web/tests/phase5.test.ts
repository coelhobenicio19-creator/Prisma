import { describe, it, expect } from 'vitest';
import { toJson, toMarkdown, toHtmlDoc, escapeXml, docsToHtmlBody } from '../src/services/export';
import { layoutMindMap, layoutSize, MindNode } from '../src/utils/mindmap';

describe('export — serializadores puros', () => {
  const docs = [
    { title: 'Aula 1 <intro>', content: 'Conteúdo com & e "aspas"', tags: ['dir', 'cap1'], created_at: '2026-11-14' },
    { title: 'Resumo', content: 'linha1\nlinha2' },
  ];

  it('toJson é JSON válido com 2 docs', () => {
    const j = JSON.parse(toJson(docs));
    expect(j.length).toBe(2);
    expect(j[0].title).toContain('Aula 1');
  });

  it('toMarkdown gera headings e escapa nada (md cru)', () => {
    const md = toMarkdown(docs);
    expect(md).toContain('# PRISMA');
    expect(md).toContain('## Aula 1 <intro>');
    expect(md).toContain('*tags:* dir, cap1');
    expect(md).toContain('---');
  });

  it('escapeXml escapa caracteres perigosos', () => {
    expect(escapeXml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('toHtmlDoc produz HTML abrível no Word (.doc)', () => {
    const html = toHtmlDoc('Título', docsToHtmlBody(docs));
    expect(html).toContain('<?xml version="1.0"');
    expect(html).toContain('<h1>Aula 1 &lt;intro&gt;</h1>');
    expect(html).toContain('linha1<br>linha2');
  });
});

describe('mindmap — layout puro', () => {
  const tree: MindNode = {
    label: 'ENEM',
    children: [
      { label: 'Matemática', children: [{ label: 'Álgebra' }, { label: 'Geometria' }] },
      { label: 'Português', children: [{ label: 'Gramática' }] },
      { label: 'Redação' },
    ],
  };

  it('calcula posições: raiz em x=0, filhos em x>0', () => {
    const root = layoutMindMap(tree);
    expect(root.x).toBe(0);
    expect(root.children.length).toBe(3);
    expect(root.children[0].x).toBeGreaterThan(0);
    expect(root.children[0].children.length).toBe(2);
  });

  it('folhas não se sobrepõem verticalmente', () => {
    const root = layoutMindMap(tree);
    const ys: number[] = [];
    (function walk(n: any) { if (n.children.length === 0) ys.push(n.y); n.children.forEach(walk); })(root);
    const sorted = [...ys].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1] + 40); // NODE_H
    }
  });

  it('layoutSize cobre todos os nós', () => {
    const root = layoutMindMap(tree);
    const { width, height } = layoutSize(root);
    expect(width).toBeGreaterThan(160);
    expect(height).toBeGreaterThan(40 * 4); // 4 folhas
  });
});
