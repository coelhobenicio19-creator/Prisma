// ============================================================
// LIA — Memória acadêmica controlada (server-side)
// Só registra fatos com fonte citada; nunca inventa.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const USE_MOCK = process.env.USE_MOCK_DB === '1' || !SUPABASE_URL;

export interface MemoryEntry {
  id: string;
  profile_id: string;
  kind: 'fact' | 'preference' | 'goal' | 'weakness' | 'source';
  content: string;
  confidence: number;
  source?: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

async function sb<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const mockMemory: MemoryEntry[] = [];

export const memory = {
  async list(profileId: string, kind?: string): Promise<MemoryEntry[]> {
    if (USE_MOCK) {
      return mockMemory.filter((m) => m.profile_id === profileId && (!kind || m.kind === kind));
    }
    let path = `lia_memory?profile_id=eq.${profileId}&select=*&order=created_at.desc`;
    if (kind) path += `&kind=eq.${kind}`;
    return sb<MemoryEntry[]>(path);
  },

  async remember(profileId: string, entry: {
    kind: MemoryEntry['kind'];
    content: string;
    source?: string;
    confidence?: number;
  }): Promise<MemoryEntry | null> {
    // Regra: só grava se tiver fonte (user, document:id) — nunca "inferred" sem verificação
    if (!entry.source) return null;
    const verified = (entry.confidence ?? 0.5) >= 0.8;
    if (USE_MOCK) {
      const m: MemoryEntry = {
        id: crypto.randomUUID(), profile_id: profileId,
        kind: entry.kind, content: entry.content,
        confidence: entry.confidence ?? 0.5, source: entry.source,
        verified, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      mockMemory.push(m);
      return m;
    }
    const rows = await sb<MemoryEntry[]>('lia_memory?select=*', {
      method: 'POST',
      body: JSON.stringify({
        profile_id: profileId, kind: entry.kind, content: entry.content,
        confidence: entry.confidence ?? 0.5, source: entry.source, verified,
      }),
    });
    return rows[0] ?? null;
  },

  /** Formata a memória para injetar no system prompt da LIA. */
  async formatForPrompt(profileId: string): Promise<string> {
    const entries = await this.list(profileId);
    const verified = entries.filter((e) => e.verified);
    if (!verified.length) return '';
    return (
      '\n\n## MEMÓRIA ACADÊMICA (fatos verificados sobre o usuário):\n' +
      verified.map((e) => `- [${e.kind}] ${e.content} (fonte: ${e.source})`).join('\n')
    );
  },
};
