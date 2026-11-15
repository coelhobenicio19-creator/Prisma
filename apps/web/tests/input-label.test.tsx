import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Input } from '../src/components/ui/Input';

it('preserva o rótulo externo associado pelo id em vez de substituí-lo pelo exemplo do campo', () => {
  const html=renderToStaticMarkup(<><label htmlFor="subject">Disciplina</label><Input id="subject" placeholder="Ex.: Física"/></>);
  expect(html).toContain('for="subject"');
  expect(html).not.toContain('aria-label="Ex.: Física"');
});
