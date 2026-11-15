// Setup mínimo para testes em ambiente node (sem DOM).
import { vi } from 'vitest';

// localStorage mock mínimo (alguns módulos podem tocar em import)
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

export { vi };