// Módulos de avaliação/conhecimento que faltavam como rota:
// Questions, Error Lab, Exam Intelligence, Active Learning.
// Todos usam endpoints reais (api.ts) — nada simulado.
import { useEffect, useMemo, useState } from 'react';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  listQuestions, createQuestion, answerQuestion, Question,
  getDueCards, listGoals, getDashboardData,
} from '@/services/api';
import { accuracyPercent } from '@/utils/academic';

function useProfileId(): string | null {
  return useProfileStore((s) => s.currentProfile?.id ?? null);
}

// ---------------- Questions ----------------
export function QuestionsPage() {
  const pid = useProfileId();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stem, setStem] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!pid) return;
    try { setQuestions(await listQuestions(pid)); } catch (e) { setError(String(e)); }
  };
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [pid]);

  const add = async () => {
    if (!pid || !stem.trim()) return;
    setLoading(true);
    try {
      await createQuestion(pid, { stem: stem.trim(), type: 'discursiva', subject: subject || undefined });
      setStem(''); setSubject(''); await load();
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  };

  const answer = async (q: Question, correct: boolean) => {
    if (!pid) return;
    try { await answerQuestion(pid, q.id, correct); await load(); } catch (e) { setError(String(e)); }
  };

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">PRATIQUE. DESCUBRA. EVOLUA.</span>
        <h1 className="text-2xl font-bold text-text-primary">Questões</h1>
        <p className="text-text-muted">Uma pergunta de cada vez. Pratique e acompanhe o que está aprendendo.</p>
      </div>
      <Card className="p-4 space-y-3">
        <Input label="Enunciado" value={stem} onChange={(e) => setStem(e.target.value)} placeholder="Digite a questão..." />
        <Input label="Disciplina (opcional)" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Matemática" />
        <Button onClick={add} disabled={loading || !stem.trim()}>{loading ? 'Salvando...' : 'Adicionar questão'}</Button>
        {error && <p className="text-sm text-error">{error}</p>}
      </Card>
      <div className="space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="p-4">
            <p className="font-medium text-text-primary mb-1">{q.stem}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {q.subject && <Badge variant="neutral">{q.subject}</Badge>}
              <Badge variant="primary">{q.times_seen}x vista</Badge>
              <Badge variant={q.times_seen > 0 && q.times_correct === q.times_seen ? 'success' : 'warning'}>
                {accuracyPercent(q.times_correct, q.times_seen)}% acerto
              </Badge>
              <span className="flex-1" />
              <Button size="sm" variant="secondary" onClick={() => answer(q, true)}>Acertei</Button>
              <Button size="sm" variant="secondary" onClick={() => answer(q, false)}>Errei</Button>
            </div>
          </Card>
        ))}
        {questions.length === 0 && <p className="text-text-muted">Nenhuma questão ainda.</p>}
      </div>
    </div>
  );
}

// ---------------- Error Lab ----------------
export function ErrorLabPage() {
  const pid = useProfileId();
  const [questions, setQuestions] = useState<Question[]>([]);
  useEffect(() => {
    if (!pid) return;
    listQuestions(pid).then(setQuestions).catch(() => {});
  }, [pid]);

  const mistakes = useMemo(
    () => questions
      .filter((q) => q.times_seen > 0 && q.times_correct < q.times_seen)
      .sort((a, b) => accuracyPercent(a.times_correct, a.times_seen) - accuracyPercent(b.times_correct, b.times_seen)),
    [questions]
  );

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">PRATIQUE. DESCUBRA. EVOLUA.</span>
        <h1 className="text-2xl font-bold text-text-primary">Caderno de erros</h1>
        <p className="text-text-muted">Cada dificuldade é uma pista. Revise suas tentativas e descubra onde aprofundar.</p>
      </div>
      {mistakes.length === 0 && (
        <Card className="p-6"><p className="text-text-muted">Seu caderno ainda está em branco. Suas próximas tentativas vão ajudar a encontrar pontos de atenção.</p></Card>
      )}
      <div className="space-y-3">
        {mistakes.map((q) => (
          <Card key={q.id} className="p-4 border-l-4 border-error">
            <p className="font-medium text-text-primary mb-1">{q.stem}</p>
            <div className="flex gap-2 flex-wrap">
              {q.subject && <Badge variant="neutral">{q.subject}</Badge>}
              <Badge variant="warning">{accuracyPercent(q.times_correct, q.times_seen)}% acerto em {q.times_seen} tentativas</Badge>
              {q.explanation && <span className="text-sm text-text-muted">{q.explanation}</span>}
            </div>
            <p className="text-xs text-text-muted mt-2">Recomendação: revise o conceito no Atlas e refaça em Recall.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------- Exam Intelligence ----------------
export function ExamIntelPage() {
  const pid = useProfileId();
  const [questions, setQuestions] = useState<Question[]>([]);
  useEffect(() => {
    if (!pid) return;
    listQuestions(pid).then(setQuestions).catch(() => {});
  }, [pid]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { total: number; seen: number; correct: number }>();
    for (const q of questions) {
      const s = q.subject ?? 'Sem disciplina';
      const e = map.get(s) ?? { total: 0, seen: 0, correct: 0 };
      e.total++; e.seen += q.times_seen; e.correct += q.times_correct;
      map.set(s, e);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [questions]);

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">PRATIQUE. DESCUBRA. EVOLUA.</span>
        <h1 className="text-2xl font-bold text-text-primary">Análise de provas</h1>
        <p className="text-text-muted">Enxergue os padrões por disciplina e direcione seu próximo estudo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bySubject.map(([subject, e]) => (
          <Card key={subject} className="p-4">
            <h3 className="font-semibold text-text-primary">{subject}</h3>
            <p className="text-sm text-text-muted">{e.total} questões · {e.seen} respondidas</p>
            <p className="text-sm font-medium mt-1">
              Acerto: <span className={accuracyPercent(e.correct, e.seen) >= 70 ? 'text-success' : 'text-warning'}>
                {accuracyPercent(e.correct, e.seen)}%
              </span>
            </p>
          </Card>
        ))}
        {bySubject.length === 0 && <Card className="p-6"><p className="text-text-muted">Sem dados — importe questões primeiro.</p></Card>}
      </div>
    </div>
  );
}

// ---------------- Active Learning ----------------
export function ActiveLearningPage() {
  const pid = useProfileId();
  const [due, setDue] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [goals, setGoals] = useState<{ id: string; title: string; target_type: string }[]>([]);
  const [dash, setDash] = useState<{ accuracy?: number } | null>(null);

  useEffect(() => {
    if (!pid) return;
    getDueCards(pid, 200).then((c) => setDue(c.length)).catch(() => {});
    listQuestions(pid).then(setQuestions).catch(() => {});
    listGoals(pid).then(setGoals).catch(() => {});
    getDashboardData(pid).then((d) => setDash(d as { accuracy?: number })).catch(() => {});
  }, [pid]);

  const weak = useMemo(() => {
    const map = new Map<string, { seen: number; correct: number }>();
    for (const q of questions) {
      if (q.times_seen === 0) continue;
      const s = q.subject ?? 'Geral';
      const e = map.get(s) ?? { seen: 0, correct: 0 };
      e.seen += q.times_seen; e.correct += q.times_correct;
      map.set(s, e);
    }
    return [...map.entries()]
      .map(([subject, e]) => ({ subject, acc: accuracyPercent(e.correct, e.seen) }))
      .filter((x) => x.acc < 70)
      .sort((a, b) => a.acc - b.acc);
  }, [questions]);

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">PRATIQUE. DESCUBRA. EVOLUA.</span>
        <h1 className="text-2xl font-bold text-text-primary">Aprendizagem ativa</h1>
        <p className="text-text-muted">Transforme revisões, dificuldades e objetivos em próximos passos.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-sm text-text-muted">Flashcards devidos</p><p className="text-3xl font-bold text-text-primary">{due ?? '—'}</p></Card>
        <Card className="p-4"><p className="text-sm text-text-muted">Precisão geral</p><p className="text-3xl font-bold text-text-primary">{dash?.accuracy != null ? `${dash.accuracy}%` : '—'}</p></Card>
        <Card className="p-4"><p className="text-sm text-text-muted">Metas ativas</p><p className="text-3xl font-bold text-text-primary">{goals.length}</p></Card>
      </div>
      <Card className="p-4">
        <h3 className="font-semibold text-text-primary mb-2">Tópicos fracos (precisão &lt; 70%)</h3>
        {weak.length === 0 && <p className="text-text-muted">Nenhum tópico fraco identificado.</p>}
        <div className="flex gap-2 flex-wrap">
          {weak.map((w) => <Badge key={w.subject} variant="warning">{w.subject} — {w.acc}%</Badge>)}
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-text-primary mb-2">Próximas ações recomendadas</h3>
        <ul className="list-disc pl-5 text-sm text-text-muted space-y-1">
          {due !== null && due > 0 && <li>Revisar {due} flashcard(s) agora em Recall (FSRS).</li>}
          {weak.slice(0, 3).map((w) => <li key={w.subject}>Estudar “{w.subject}” no Learn/Atlas e gerar questões no Questions.</li>)}
          {goals.map((g) => <li key={g.id}>Meta ativa: {g.title} ({g.target_type}) — registre progresso no Dashboard.</li>)}
          {due === 0 && weak.length === 0 && goals.length === 0 && <li>Tudo em dia. Continue o ciclo: Learn → Recall → Exams.</li>}
        </ul>
      </Card>
    </div>
  );
}
