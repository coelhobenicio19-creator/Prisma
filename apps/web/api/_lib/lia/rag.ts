// ============================================================
// LIA — RAG: gera embedding da query e busca vetorial no pgvector
// Usa NVIDIA API para embeddings (mesma chave do chat).
// ============================================================

import { db } from '../db';
import { rerank } from './rerank';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? '';
const NVIDIA_BASE = process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
const EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL ?? 'nvidia/nv-embed-v1';

export interface RagCitation {
  document_id: string;
  chunk_id: string;
  content: string;
  similarity: number;
  title?: string;
}

/** Gera embedding (1024-dim truncado para 1536 se necessário) via NVIDIA. */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!NVIDIA_API_KEY) return null;
  try {
    const res = await fetch(`${NVIDIA_BASE}/embeddings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: text.slice(0, 8000),
        input_type: 'query',
        encoding_format: 'float',
        truncate: 'END',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const emb: number[] = data.data?.[0]?.embedding ?? [];
    // nv-embed-v1 retorna 2048 dims; o schema usa 1536 — faz padding/truncagem simples
    const target = 1536;
    if (emb.length > target) return emb.slice(0, target);
    if (emb.length < target) return [...emb, ...new Array(target - emb.length).fill(0)];
    return emb;
  } catch {
    return null;
  }
}

/** Busca vetorial + rerank híbrido (vetor 65% + léxico 35%): busca 3x candidatos e reordena. */
export async function ragSearch(profileId: string, query: string, limit = 5): Promise<RagCitation[]> {
  const embedding = await generateEmbedding(query);
  if (!embedding) return [];
  const candidates = await db.vectorSearch(profileId, embedding, Math.max(limit * 3, limit + 5));
  const order = rerank(query, candidates.map((c) => ({ id: c.id, content: c.content, similarity: c.similarity })), limit);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const out: RagCitation[] = [];
  for (const id of order) {
    const r = byId.get(id);
    if (!r) continue;
    const doc = await db.getDocument(r.document_id);
    out.push({
      document_id: r.document_id,
      chunk_id: r.id,
      content: r.content,
      similarity: r.similarity,
      title: doc?.title,
    });
  }
  return out;
}

/** Formata citações para injetar no contexto da LIA. */
export function formatCitations(citations: RagCitation[]): string {
  if (!citations.length) return '';
  return (
    '\n\n## TRECHOS RELEVANTES DOS SEUS DOCUMENTOS (cite como [doc: título]):\n' +
    citations
      .map((c, i) => `[${i + 1}] [doc: ${c.title ?? c.document_id}] (similaridade ${(c.similarity * 100).toFixed(1)}%)\n${c.content.slice(0, 1500)}`)
      .join('\n\n')
  );
}
