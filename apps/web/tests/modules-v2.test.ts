import { describe, it, expect } from 'vitest';
import { gradeExam, weightedGrade, forecast, hasCycle, updateMastery } from '../api/_lib/academic';
import { buildInitialAtlas, extractTopicsFromText } from '../api/_lib/knowledge';
import { deriveNodeState, layoutGraph, layout3D, rotate3D, project } from '../src/utils/atlas';
import { tokenize, lexicalScore, rerank } from '../api/_lib/lia/rerank';

describe('gradeExam (correção determinística no servidor)', () => {
  const qs = [
    { id: 'q1', correct_answer: 'Paris', type: 'text' },
    { id: 'q2', correct_answer: '42', type: 'numeric' },
  ];
  it('normaliza caixa/espaços e conta acertos', () => {
    const r = gradeExam(qs, { q1: '  paris ', q2: '42' });
    expect(r.score).toBe(2); expect(r.maxScore).toBe(2);
    expect(r.perQuestion).toEqual({ q1: true, q2: true });
  });
  it('resposta ausente conta como erro', () => {
    const r = gradeExam(qs, { q1: 'Paris' });
    expect(r.score).toBe(1); expect(r.perQuestion.q2).toBe(false);
  });
  it('numérica aceita vírgula decimal', () => {
    const r = gradeExam([{ id: 'q', correct_answer: '2,5', type: 'numeric' }], { q: '2.5' });
    expect(r.perQuestion.q).toBe(true);
  });
});

describe('weightedGrade', () => {
  it('média ponderada 0..100', () => {
    expect(weightedGrade([{ value: 10, max_value: 10, weight: 1 }, { value: 5, max_value: 10, weight: 3 }])).toBeCloseTo(62.5);
  });
  it('lista vazia = 0', () => { expect(weightedGrade([])).toBe(0); });
});

describe('forecast (incerteza explícita)', () => {
  it('dados suficientes e alta precisão → nota alta, incerteza baixa', () => {
    const f = forecast({ accuracy: 0.9, coverage: 0.9, hoursAvailable: 40, hoursNeededEstimate: 5, sampleSize: 120 });
    expect(f.sufficientData).toBe(true);
    expect(f.uncertainty).toBe('baixa');
    expect(f.expectedScore).toBeGreaterThan(80);
  });
  it('pouca amostra → dados insuficientes e incerteza alta', () => {
    const f = forecast({ accuracy: 0.5, coverage: 0.2, hoursAvailable: 40, hoursNeededEstimate: 50, sampleSize: 5 });
    expect(f.sufficientData).toBe(false);
    expect(f.uncertainty).toBe('alta');
    expect(f.expectedScore).toBeLessThan(50);
  });
});

describe('hasCycle (DFS)', () => {
  const E = (a: string, b: string) => ({ from: a, to: b });
  it('detecta ciclo', () => {
    expect(hasCycle([E('a', 'b'), E('b', 'c'), E('c', 'a')])).toBe(true);
  });
  it('grafo acíclico passa', () => {
    expect(hasCycle([E('a', 'b'), E('b', 'c'), E('a', 'c')])).toBe(false);
  });
  it('aresta extra que fecha ciclo é detectada', () => {
    expect(hasCycle([E('a', 'b'), E('b', 'c')], E('c', 'a'))).toBe(true);
  });
});

describe('updateMastery', () => {
  it('acerto aumenta, erro diminui, limitado a [0,1]', () => {
    expect(updateMastery(0.5, true)).toBeCloseTo(0.65);
    expect(updateMastery(0.5, false)).toBeCloseTo(0.35);
    expect(updateMastery(1, true)).toBe(1);
    expect(updateMastery(0, false)).toBe(0);
  });
});

describe('perfil de conhecimento → atlas inicial', () => {
  it('extrai tópicos do texto livre sem duplicar', () => {
    const t = extractTopicsFromText('Estudei robótica e física. Fiz projetos de robótica com sensores.');
    expect(t.length).toBeGreaterThan(0);
    expect(new Set(t.map((x) => x.topic)).size).toBe(t.length);
  });
  it('nós iniciais são declarados com mastery 0 (nunca provado)', () => {
    const nodes = buildInitialAtlas({
      interests: ['IA', 'astrofísica'],
      favorite_subjects: ['Física'],
      difficult_subjects: ['Química'],
      free_text: 'Já fiz curso de programação em Python e robótica.',
    });
    expect(nodes.length).toBeGreaterThan(3);
    expect(nodes.every((n) => n.mastery === 0 && n.source === 'declared')).toBe(true);
    expect(nodes.some((n) => n.subject === 'Física' && n.topic === 'base declarada')).toBe(true);
    expect(nodes.some((n) => n.subject === 'Química' && n.topic === 'lacuna declarada')).toBe(true);
  });
});

describe('deriveNodeState (estado visual determinístico)', () => {
  const base = { mastery: 0.5, seen: 5, accuracy: 0.8, dueReviews: 0, errorCount: 0, prereqPending: false };
  it('dificuldade quando acerto baixo com volume', () => {
    expect(deriveNodeState({ ...base, accuracy: 0.3 })).toBe('dificuldade');
  });
  it('em revisão quando há flashcards devidos', () => {
    expect(deriveNodeState({ ...base, dueReviews: 2 })).toBe('em revisão');
  });
  it('dominado a partir de 0.8', () => {
    expect(deriveNodeState({ ...base, mastery: 0.85 })).toBe('dominado');
  });
  it('pré-requisito pendente tem prioridade sobre dificuldade', () => {
    expect(deriveNodeState({ ...base, prereqPending: true, accuracy: 0.1 })).toBe('pré-requisito pendente');
  });
  it('não iniciado quando zerado', () => {
    expect(deriveNodeState({ mastery: 0, seen: 0, accuracy: null, dueReviews: 0, errorCount: 0, prereqPending: false })).toBe('não iniciado');
  });
});

describe('rerank híbrido do RAG (vetor + léxico)', () => {
  it('tokenize remove stopwords e acentos', () => {
    expect(tokenize('O que é fotossíntese?')).toEqual(['fotossintese']);
  });
  it('lexicalScore alto quando termos da query estão no texto', () => {
    expect(lexicalScore('equação segundo grau', 'A equação do segundo grau tem forma ax²+bx+c')).toBeGreaterThan(0.5);
    expect(lexicalScore('equação segundo grau', 'receita de bolo de chocolate com calda')).toBeLessThan(0.2);
  });
  it('rerank promove o trecho lexicalmente relevante mesmo com vetor menor', () => {
    const rows = [
      { id: 'A', content: 'segunda guerra mundial, nazismo e Pearl Harbor', similarity: 0.9 },
      { id: 'B', content: 'equação do segundo grau: ax² + bx + c = 0, fórmula de Bhaskara', similarity: 0.6 },
    ];
    expect(rerank('equação de segundo grau bhaskara', rows, 1)).toEqual(['B']);
  });
  it('respeita o limit', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i), content: `tema ${i}`, similarity: 0.5 }));
    expect(rerank('tema', rows, 3).length).toBe(3);
  });
});

describe('grafo 3D (layout3D/rotate3D/project)', () => {
  const nodes = [
    { id: '1', subject: 'Mat', topic: 'Funções' },
    { id: '2', subject: 'Física', topic: 'Cinemática' },
  ];
  it('layout3D gera núcleo por disciplina + tópicos, tudo dentro do raio', () => {
    const g = layout3D(nodes, 260);
    expect(g.filter((n) => n.isSubject).length).toBe(2);
    expect(g.length).toBe(4);
    expect(g.every((n) => Math.hypot(n.x, n.y, n.z) <= 260 + 96)).toBe(true);
  });
  it('rotate3D preserva a norma (rotação não distorce)', () => {
    const p = { x: 100, y: -50, z: 200 };
    const r = rotate3D(p, 0.7, -0.3);
    expect(Math.hypot(r.x, r.y, r.z)).toBeCloseTo(Math.hypot(p.x, p.y, p.z), 6);
  });
  it('project: objeto na frente (z>0) fica maior, atrás menor', () => {
    const front = project({ x: 0, y: 0, z: 300 }, 400, 300);
    const back = project({ x: 0, y: 0, z: -300 }, 400, 300);
    expect(front.scale).toBeGreaterThan(1);
    expect(back.scale).toBeLessThan(1);
    expect(front.x).toBe(400);
  });
});

describe('layoutGraph (posições determinísticas)', () => {
  it('núcleo de disciplina + tópicos ao redor, dentro do viewBox', () => {
    const g = layoutGraph([
      { id: '1', subject: 'Mat', topic: 'Funções' },
      { id: '2', subject: 'Mat', topic: 'Trigonometria' },
      { id: '3', subject: 'Física', topic: 'Cinemática' },
    ], 900, 560);
    const subjects = g.filter((n) => n.isSubject);
    expect(subjects.length).toBe(2);
    expect(g.every((n) => n.x >= 0 && n.x <= 900 && n.y >= 0 && n.y <= 560)).toBe(true);
    // determinístico
    const g2 = layoutGraph([{ id: '1', subject: 'Mat', topic: 'Funções' }], 900, 560);
    expect(g2[1].x).toBe(layoutGraph([{ id: '1', subject: 'Mat', topic: 'Funções' }], 900, 560)[1].x);
  });
});
