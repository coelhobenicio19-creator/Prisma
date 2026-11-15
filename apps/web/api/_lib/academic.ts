// ============================================================
// Funções puras de regras acadêmicas (server-side, testáveis).
// Nenhuma depende de IA — tudo determinístico.
// ============================================================

/** Correção determinística de prova: compara respostas com o gabarito.
 *  Retorna {score, maxScore, perQuestion}. Respostas ausentes contam como erradas. */
export function gradeExam(
  questions: Array<{ id: string; correct_answer?: string | null; type?: string }>,
  answers: Record<string, unknown>
): { score: number; maxScore: number; perQuestion: Record<string, boolean> } {
  const perQuestion: Record<string, boolean> = {};
    let score = 0;
  for (const q of questions) {
    const given = answers[q.id];
    const ok = normalizeAnswer(given, q.type) !== null && normalizeAnswer(given, q.type) === normalizeAnswer(q.correct_answer, q.type);
    perQuestion[q.id] = ok;
    if (ok) score += 1;
  }
  return { score, maxScore: questions.length, perQuestion };
}

function normalizeAnswer(a: unknown, type?: string): string | null {
  if (a === null || a === undefined) return null;
  if (typeof a === 'boolean') return a ? 'true' : 'false';
  let s = String(a).trim().toLowerCase();
  if (type === 'numeric') s = s.replace(',', '.'); // vírgula decimal aceita
  return s;
}

/** Média ponderada de notas. value/maxValue normaliza cada nota para 0..1 antes do peso. */
export function weightedGrade(grades: Array<{ value: number; max_value: number; weight: number }>): number {
  if (!grades.length) return 0;
  let sumW = 0, acc = 0;
  for (const g of grades) {
    const max = g.max_value > 0 ? g.max_value : 1;
    const w = g.weight > 0 ? g.weight : 1;
    acc += (g.value / max) * w;
    sumW += w;
  }
  if (sumW === 0) return 0;
  return Math.round((acc / sumW) * 1000) / 10; // 0..100
}

export interface ForecastInput {
  accuracy: number;        // 0..1 do histórico real
  coverage: number;        // 0..1 (tópicos do edital cobertos)
  hoursAvailable: number;  // horas restantes até a prova
  hoursNeededEstimate: number; // estimativa horas p/ cobrir o resto
  sampleSize: number;      // nº de questões/vistas (confiabilidade)
}

export interface ForecastOutput {
  expectedScore: number;   // 0..100 estimado
  uncertainty: 'alta' | 'média' | 'baixa';
  sufficientData: boolean;
  note: string;
}

/** Estimativa determinística com intervalo por incerteza.
 *  sampleSize < 30 → dados insuficientes (incerteza alta, nota rebaixada). */
export function forecast(input: ForecastInput): ForecastOutput {
  const sufficientData = input.sampleSize >= 30;
  const acc = clamp01(input.accuracy);
  const cov = clamp01(input.coverage);
  // base: histórico de acertos; cobertura pondera quanto falta
  let expected = acc * 100 * (0.5 + 0.5 * cov);
  // se tempo disponível < tempo necessário, reduz proporcionalmente (máx -30 pontos)
  if (input.hoursNeededEstimate > 0 && input.hoursAvailable < input.hoursNeededEstimate) {
    const ratio = clamp01(input.hoursAvailable / input.hoursNeededEstimate);
    expected = expected * (0.7 + 0.3 * ratio);
  }
  if (!sufficientData) {
    return {
      expectedScore: Math.round(expected * 0.8 * 10) / 10,
      uncertainty: 'alta',
      sufficientData: false,
      note: `Amostra insuficiente (${input.sampleSize} < 30) — estimativa pouco confiável.`,
    };
  }
  const uncertainty = input.sampleSize >= 100 && cov > 0.5 ? 'baixa' : 'média';
  return { expectedScore: Math.round(expected * 10) / 10, uncertainty, sufficientData: true, note: 'Estimativa baseada em dados reais de questões/sessões.' };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/** Detecta ciclo em grafo de arestas (pré-requisitos). DFS iterative. */
export function hasCycle(edges: Array<{ from: string; to: string }>, extra?: { from: string; to: string }): boolean {
  const adj = new Map<string, string[]>();
  const all = extra ? [...edges, extra] : edges;
  for (const e of all) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e.to);
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const dfs = (u: string): boolean => {
    color.set(u, GRAY);
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(v)) return true;
    }
    color.set(u, BLACK);
    return false;
  };
  for (const u of adj.keys()) {
    if ((color.get(u) ?? WHITE) === WHITE && dfs(u)) return true;
  }
  return false;
}

/** Atualiza domínio (mastery) de um nó a partir de acerto/erro — média móvel simples. */
export function updateMastery(current: number, correct: boolean, weight = 0.3): number {
  const target = correct ? 1 : 0;
  const next = current + (target - current) * weight;
  return Math.round(Math.min(1, Math.max(0, next)) * 1000) / 1000;
}
