// ============================================================
// Utilitários acadêmicos puros (testáveis em node, sem DOM).
// Nenhum cálculo acadêmico depende de IA — tudo determinístico.
// ============================================================

/** Avaliador matemático seguro: só números, operadores, parênteses, funções.
 *  Implementado como parser shunting-yard — sem eval(). */
export function evaluateMath(expr: string): number {
  const tokens = tokenize(expr);
  const output: number[] = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, '%': 2, 'u-': 4 };
  const rightAssoc: Record<string, boolean> = { '^': true, 'u-': true };
  const funcs: Record<string, (x: number) => number> = {
    sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
    ln: Math.log, log: Math.log10, exp: Math.exp, floor: Math.floor, ceil: Math.ceil,
  };

  const apply = (op: string) => {
    const f = funcs[op];
    if (f) {
      const a = output.pop();
      if (a === undefined) throw new Error('expressão inválida');
      output.push(f(a));
      return;
    }
    if (op === 'u-') { const a = output.pop(); if (a === undefined) throw new Error('expressão inválida'); output.push(-a); return; }
    const b = output.pop(); const a = output.pop();
    if (a === undefined || b === undefined) throw new Error('expressão inválida');
    switch (op) {
      case '+': output.push(a + b); break;
      case '-': output.push(a - b); break;
      case '*': output.push(a * b); break;
      case '/': if (b === 0) throw new Error('divisão por zero'); output.push(a / b); break;
      case '%': output.push(a % b); break;
      case '^': output.push(Math.pow(a, b)); break;
      default: throw new Error(`operador desconhecido: ${op}`);
    }
  };

  let expectOperand = true;
  for (const t of tokens) {
    if (t.type === 'num') {
      if (!expectOperand) throw new Error('número após operando');
      output.push(t.value); expectOperand = false;
    } else if (t.type === 'func') {
      if (!expectOperand) throw new Error('função após operando');
      ops.push(t.name); expectOperand = true;
    } else if (t.value === '(') {
      ops.push('('); expectOperand = true;
    } else if (t.value === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply(ops.pop()!);
      if (!ops.length) throw new Error('parêntese desbalanceado');
      ops.pop();
      if (ops.length && funcs[ops[ops.length - 1]]) apply(ops.pop()!);
      expectOperand = false;
    } else if (t.type === 'op') {
      if (t.value === '-' && expectOperand) { ops.push('u-'); continue; }
      if (expectOperand) throw new Error('operador em posição inválida');
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === '(') break;
        const topIsFunc = !!funcs[top];
        if (topIsFunc) { apply(ops.pop()!); continue; }
        const pTop = prec[top] ?? 0; const pCur = prec[t.value] ?? 0;
        if (pTop > pCur || (pTop === pCur && !rightAssoc[t.value])) apply(ops.pop()!);
        else break;
      }
      ops.push(t.value); expectOperand = true;
    }
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op === '(') throw new Error('parêntese desbalanceado');
    apply(op);
  }
  if (output.length !== 1) throw new Error('expressão inválida');
  const result = output[0];
  if (!Number.isFinite(result)) throw new Error('resultado não finito');
  return result;
}

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: string }
  | { type: 'func'; name: string };
function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.replace(/,/g, '.'); // vírgula decimal → ponto
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; let dots = 0;
      while (j < s.length && /[0-9.]/.test(s[j])) { if (s[j] === '.') dots++; j++; }
      if (dots > 1) throw new Error('número malformado');
      tokens.push({ type: 'num', value: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      tokens.push({ type: 'func', name: s.slice(i, j).toLowerCase() });
      i = j; continue;
    }
    if ('+-*/^%()'.includes(c)) { tokens.push({ type: 'op', value: c }); i++; continue; }
    throw new Error(`caractere não permitido: ${c}`);
  }
  // valida nomes de função
  const known = ['sqrt', 'abs', 'sin', 'cos', 'tan', 'ln', 'log', 'exp', 'floor', 'ceil'];
  for (const t of tokens) {
    if (t.type === 'func' && !known.includes(t.name)) throw new Error(`função desconhecida: ${t.name}`);
  }
  return tokens;
}

/** Porcentagem de acerto (0-100). total=0 → 0 (evita divisão por zero). */
export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 1000) / 10;
}

/** Diff de linhas simples (LCS) — retorna blocos {type, text}. */
export interface DiffLine { type: 'same' | 'add' | 'del'; text: string }
export function diffLines(a: string, b: string): DiffLine[] {
  const A = a.split('\n'); const B = b.split('\n');
  const n = A.length, m = B.length;
  // LCS por DP (limitado a 2000x2000 para segurança)
  if (n * m > 4_000_000) {
    return [...A.map((text): DiffLine => ({ type: 'del', text })), ...B.map((text): DiffLine => ({ type: 'add', text }))];
  }
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: 'same', text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i] }); i++; }
    else { out.push({ type: 'add', text: B[j] }); j++; }
  }
  while (i < n) { out.push({ type: 'del', text: A[i] }); i++; }
  while (j < m) { out.push({ type: 'add', text: B[j] }); j++; }
  return out;
}

/** Média ponderada simples. */
export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Média ponderada de notas (0..100): normaliza value/max_value e aplica weight. */
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
  return Math.round((acc / sumW) * 1000) / 10;
}

export interface ForecastInput {
  accuracy: number; coverage: number; hoursAvailable: number; hoursNeededEstimate: number; sampleSize: number;
}
export interface ForecastOutput {
  expectedScore: number; uncertainty: 'alta' | 'média' | 'baixa'; sufficientData: boolean; note: string;
}

/** Estimativa determinística com indicador de incerteza (espelha api/_lib/academic.ts). */
export function forecast(input: ForecastInput): ForecastOutput {
  const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
  const sufficientData = input.sampleSize >= 30;
  const acc = clamp01(input.accuracy); const cov = clamp01(input.coverage);
  let expected = acc * 100 * (0.5 + 0.5 * cov);
  if (input.hoursNeededEstimate > 0 && input.hoursAvailable < input.hoursNeededEstimate) {
    const ratio = clamp01(input.hoursAvailable / input.hoursNeededEstimate);
    expected = expected * (0.7 + 0.3 * ratio);
  }
  if (!sufficientData) {
    return { expectedScore: Math.round(expected * 0.8 * 10) / 10, uncertainty: 'alta', sufficientData: false, note: `Amostra insuficiente (${input.sampleSize} < 30) — estimativa pouco confiável.` };
  }
  const uncertainty = input.sampleSize >= 100 && cov > 0.5 ? 'baixa' : 'média';
  return { expectedScore: Math.round(expected * 10) / 10, uncertainty, sufficientData: true, note: 'Estimativa baseada em dados reais de questões/sessões.' };
}
