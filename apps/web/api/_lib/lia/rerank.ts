// ============================================================
// Rerank híbrido determinístico: combina similaridade vetorial
// (pgvector) com sobreposição léxica (TF normalizada) da query.
// Puro e testável — sem IA, sem chamada externa.
// ============================================================

const STOP = new Set([
  'o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'que', 'qual', 'quais', 'como', 'quando', 'onde', 'e', 'ou', 'um', 'uma',
  'meu', 'minha', 'seu', 'sua', 'ser', 'esta', 'esse', 'isso', 'explique', 'definir', 'definicao',
]);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .match(/[a-zà-ÿ0-9]+/g) ?? [])
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Score léxico 0..1: fração ponderada dos termos da query presentes no texto (raiz simples). */
export function lexicalScore(query: string, text: string): number {
  const qTerms = tokenize(query);
  if (!qTerms.length) return 0;
  const tTerms = new Set(tokenize(text));
  let hit = 0;
  for (const q of qTerms) {
    const root = q.slice(0, Math.max(4, q.length - 2));
    if (tTerms.has(q) || [...tTerms].some((t) => t.startsWith(root))) hit += 1;
  }
  return hit / qTerms.length;
}

export interface RerankRow { id: string; content: string; similarity: number }

/** score final = 0.65 * similaridade vetorial + 0.35 * léxico. */
export function rerank<T extends RerankRow>(query: string, rows: T[], limit: number, wVector = 0.65): string[] {
  const wLex = 1 - wVector;
  return rows
    .map((r) => ({ r, final: wVector * r.similarity + wLex * lexicalScore(query, r.content) }))
    .sort((a, b) => b.final - a.final)
    .slice(0, limit)
    .map((x) => x.r.id);
}
