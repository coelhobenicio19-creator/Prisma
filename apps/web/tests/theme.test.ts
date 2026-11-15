import { afterEach, expect, it, vi } from 'vitest';
import { useUIStore } from '../src/store';

afterEach(() => vi.unstubAllGlobals());
it('alterna todos os tokens do tema sem deixar a classe clara ativa ao voltar ao escuro', () => {
  const classes=new Set<string>();
  const classList={add:(value:string)=>classes.add(value),remove:(value:string)=>classes.delete(value),toggle:(value:string,on:boolean)=>on?classes.add(value):classes.delete(value)};
  vi.stubGlobal('document',{documentElement:{classList}});
  useUIStore.getState().setTheme('light');
  expect(classes.has('light')).toBe(true);
  expect(classes.has('dark')).toBe(false);
  useUIStore.getState().setTheme('dark');
  expect(classes.has('dark')).toBe(true);
  expect(classes.has('light')).toBe(false);
});
