import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/components/ui/Button';

describe('ações que navegam', () => {
  it('renderiza o link de uma ação sem quebrar a tela com filhos adicionais no Slot', () => {
    const html = renderToStaticMarkup(<Button asChild><a href="/atlas">Explorar Atlas</a></Button>);
    expect(html).toContain('href="/atlas"');
    expect(html).toContain('Explorar Atlas');
    expect(html).not.toContain('<button');
  });
});
