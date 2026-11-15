import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSession, login } from '../src/services/api';

afterEach(() => vi.unstubAllGlobals());
describe('entrada pública do Prisma', () => {
  it('mantém a landing aberta quando não há sessão, sem criar um ciclo de redirecionamento', async () => {
    const location={pathname:'/',href:'/'};
    vi.stubGlobal('window',{location});
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('{}',{status:401})));
    await expect(getSession()).resolves.toBeNull();
    expect(location.href).toBe('/');
  });
  it('mantém o formulário acessível depois de credenciais recusadas', async () => {
    const location={pathname:'/',href:'/'};
    vi.stubGlobal('window',{location});
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('{}',{status:401})));
    await expect(login('test@example.com','incorrect')).rejects.toThrow();
    expect(location.href).toBe('/');
  });
});
