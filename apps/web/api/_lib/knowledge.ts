// Funções puras do perfil de conhecimento (server-side, testáveis).
// Espelha src/utils/atlas.ts — mantido separado porque api/ tem tsconfig próprio.
export interface KnowledgeProfileLite {
  interests: string[];
  favorite_subjects: string[];
  difficult_subjects: string[];
  free_text: string;
}

export function extractTopicsFromText(text: string): Array<{ subject: string; topic: string }> {
  const stop = new Set(['de', 'da', 'do', 'que', 'e', 'o', 'a', 'em', 'para', 'com', 'por', 'mais', 'muito', 'já', 'bem']);
  const found = new Map<string, string>();
  for (const raw of text.split(/[\n,;•·.!?]+/)) {
    const words = raw.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 3 && !stop.has(w));
    if (words.length >= 2) {
      const topic = words.slice(0, 3).join(' ');
      const subject = words[words.length - 1];
      if (!found.has(topic)) found.set(topic, subject);
    }
  }
  return [...found.entries()].slice(0, 30).map(([topic, subject]) => ({ subject, topic }));
}

/** Nós iniciais do Atlas a partir do perfil — TODO conhecimento é 'declared' (declarado), nunca provado. */
export function buildInitialAtlas(p: KnowledgeProfileLite): Array<{ subject: string; topic: string; mastery: number; source: string }> {
  const nodes: Array<{ subject: string; topic: string; mastery: number; source: string }> = [];
  const seen = new Set<string>();
  const push = (subject: string, topic: string) => {
    const key = `${subject}::${topic}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push({ subject, topic, mastery: 0, source: 'declared' });
  };
  for (const s of p.interests ?? []) push(s, 'interesse geral');
  for (const s of p.favorite_subjects ?? []) push(s, 'base declarada');
  for (const s of p.difficult_subjects ?? []) push(s, 'lacuna declarada');
  for (const t of extractTopicsFromText(p.free_text ?? '')) push(t.subject, t.topic);
  return nodes;
}
