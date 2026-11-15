// ============================================================
// Lógica pura do Atlas visual (testável, sem DOM):
// layout do grafo, estado de aprendizado dos nós, construção
// inicial do mapa a partir do perfil de conhecimento.
// ============================================================

export interface AtlasNodeInput {
  id: string;
  subject: string;
  topic: string;
  mastery?: number;
  source?: string; // 'declared' | 'demonstrated' | 'inferred' | 'manual'
}

export interface NodeStateInput {
  mastery: number;
  seen: number;        // vezes que o tópico apareceu em questões
  accuracy: number | null; // null se nunca respondido
  dueReviews: number;  // flashcards devidos ligados ao tópico
  errorCount: number;  // erros recorrentes (Error Lab)
  prereqPending: boolean;
}

export type NodeState =
  | 'dificuldade' | 'em revisão' | 'dominado' | 'muito cobrado'
  | 'pré-requisito pendente' | 'em estudo' | 'não iniciado';

/** Deriva o estado visual de um nó a partir de dados reais (determinístico). */
export function deriveNodeState(n: NodeStateInput): NodeState {
  if (n.prereqPending) return 'pré-requisito pendente';
  if (n.errorCount >= 2 || (n.seen >= 3 && n.accuracy !== null && n.accuracy < 0.5)) return 'dificuldade';
  if (n.dueReviews > 0) return 'em revisão';
  if (n.mastery >= 0.8) return 'dominado';
  if (n.seen >= 10) return 'muito cobrado';
  if (n.mastery > 0 && n.mastery < 0.8) return 'em estudo';
  return 'não iniciado';
}

export const STATE_COLORS: Record<NodeState, string> = {
  'dificuldade': '#dc9691',
  'em revisão': '#d9b776',
  'dominado': '#9bc6ae',
  'muito cobrado': '#baa8ce',
  'pré-requisito pendente': '#caa085',
  'em estudo': '#95b9c8',
  'não iniciado': '#7c8e8c',
};

export interface GraphNode extends AtlasNodeInput {
  x: number; y: number; r: number; isSubject: boolean;
}

// ---------- Grafo 3D (projeção perspectiva pura, sem lib) ----------

export interface Node3D { id: string; subject: string; topic: string; x: number; y: number; z: number; r: number; isSubject: boolean }

/** Distribui disciplinas em uma órbita espacial e tópicos em torno de cada núcleo. */
export function layout3D(nodes: AtlasNodeInput[], radius = 260): Node3D[] {
  const subjects = [...new Set(nodes.map((n) => n.subject))];
  const out: Node3D[] = [];
  subjects.forEach((s, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, subjects.length) - .4;
    const isolated = subjects.length === 1;
    const sx = isolated ? 0 : Math.cos(angle) * radius;
    const sy = isolated ? 0 : Math.sin(angle) * radius * .62;
    const sz = isolated ? 0 : Math.sin(angle * 2) * radius * .3;
    out.push({ id: `subject:${s}`, subject: s, topic: s, x: sx, y: sy, z: sz, r: 34, isSubject: true });
    const list = nodes.filter((n) => n.subject === s);
    const spread = Math.min(85, Math.max(36, radius * .38));
    list.forEach((n, j) => {
      const a = (2 * Math.PI * j) / Math.max(1, list.length) + .55;
      const b = (j * 1.7) % (2 * Math.PI);
      out.push({
        ...n, r: 15,
        x: sx + spread * Math.cos(a),
        y: sy + spread * Math.sin(a),
        z: sz + spread * .5 * Math.sin(b),
        isSubject: false,
      });
    });
  });
  return out;
}

/** Rotação 3D (Y depois X), ângulos em radianos. */
export function rotate3D(p: { x: number; y: number; z: number }, ry: number, rx: number) {
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const y1 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;
  return { x: x1, y: y1, z: z2 };
}

/** Projeção perspectiva: scale < 1 atrás, > 1 na frente. */
export function project(p: { x: number; y: number; z: number }, cx: number, cy: number, persp = 900, zoom = 1) {
  const s = (persp * zoom) / (persp - p.z * zoom);
  return { x: cx + p.x * s, y: cy + p.y * s, z: p.z, scale: s };
}

/** Layout determinístico: núcleos de disciplina num círculo; tópicos ao redor do núcleo. */
export function layoutGraph(nodes: AtlasNodeInput[], width = 900, height = 560): GraphNode[] {
  const subjects = [...new Set(nodes.map((n) => n.subject))];
  const cx = width / 2; const cy = height / 2;
  const R = Math.min(width, height) * 0.32;
  const subjectPos = new Map<string, { x: number; y: number }>();
  subjects.forEach((s, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, subjects.length) - Math.PI / 2;
    subjectPos.set(s, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  });
  const bySubject = new Map<string, AtlasNodeInput[]>();
  for (const n of nodes) {
    if (!bySubject.has(n.subject)) bySubject.set(n.subject, []);
    bySubject.get(n.subject)!.push(n);
  }
  const out: GraphNode[] = [];
  for (const [s, list] of bySubject) {
    const p = subjectPos.get(s)!;
    out.push({ id: `subject:${s}`, subject: s, topic: s, x: p.x, y: p.y, r: 34, isSubject: true, mastery: 0 });
    const r = 78;
    list.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(1, list.length);
      out.push({ ...n, x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a), r: 16, isSubject: false });
    });
  }
  return out;
}

// ---------- Perfil de conhecimento → Atlas inicial ----------

export interface KnowledgeProfileLite {
  interests: string[];
  favorite_subjects: string[];
  difficult_subjects: string[];
  free_text: string;
}

/** Extrai (subject, topic) do texto livre — heurística determinística simples. */
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

/** Monta nós/edges iniciais do Atlas a partir do perfil (conhecimento DECLARADO, não provado). */
export function buildInitialAtlas(p: KnowledgeProfileLite): {
  nodes: Array<{ subject: string; topic: string; mastery: number; source: string }>;
  edges: Array<{ from: { subject: string; topic: string }; to: { subject: string; topic: string } }>;
} {
  const nodes: Array<{ subject: string; topic: string; mastery: number; source: string }> = [];
  const seen = new Set<string>();
  const push = (subject: string, topic: string) => {
    const key = `${subject}::${topic}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push({ subject, topic, mastery: 0, source: 'declared' }); // declarado ≠ dominado
  };
  for (const s of p.interests) push(s, 'interesse geral');
  for (const s of p.favorite_subjects) push(s, 'base declarada');
  for (const s of p.difficult_subjects) push(s, 'lacuna declarada');
  for (const t of extractTopicsFromText(p.free_text)) push(t.subject, t.topic);
  // edges: interesses conectam às bases declaradas da mesma área (heurística simples)
  const edges: Array<{ from: { subject: string; topic: string }; to: { subject: string; topic: string } }> = [];
  const favs = new Set(p.favorite_subjects);
  for (const s of p.interests) {
    if (favs.has(s)) edges.push({ from: { subject: s, topic: 'interesse geral' }, to: { subject: s, topic: 'base declarada' } });
  }
  return { nodes, edges };
}
