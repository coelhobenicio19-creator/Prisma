// Atlas, Learn, Exams, Focus — implementações REAIS (API persistida).
// Recall real está em pages/Recall.tsx (re-exportado aqui p/ compatibilidade).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  apiList, apiPost,
  listQuestions, listSessions, createSession, liaChat,
  startExamAttempt, autosaveAttempt, submitExam,
  ExamDef, ExamAttempt, Question, StudySession,
} from '@/services/api';
import { RecallPage } from '@/pages/Recall';

export { RecallPage as Recall };

function usePid(): string | null {
  return useProfileStore((s) => s.currentProfile?.id ?? null);
}

export { AtlasHub as Atlas } from './AtlasHub';


// ---------------- Learn ----------------
export function Learn() {
  const pid = usePid();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [notes, setNotes] = useState('');
  const [ask, setAsk] = useState(''); const [liaAnswer, setLiaAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    try { setSessions(await listSessions(pid)); } catch { /* silencioso */ }
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  const startSession = async () => {
    if (!pid) return;
    setLoading(true);
    try {
      await createSession(pid, { type: 'learn', planned_duration: 25, status: 'in_progress', started_at: new Date().toISOString(), notes });
      setNotes(''); await load();
    } finally { setLoading(false); }
  };

  const askLia = async () => {
    if (!pid || !ask.trim()) return;
    setLoading(true); setLiaAnswer('');
    try {
      const r = await liaChat(pid, null, ask, (t) => setLiaAnswer((a) => a + t));
      setLiaAnswer(r.full_text);
    } catch (e) { setLiaAnswer(`Erro: ${e}`); } finally { setLoading(false); }
  };

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">UMA CONEXÃO DE CADA VEZ</span>
        <h1 className="text-2xl font-bold text-text-primary">Aprender</h1>
        <p className="text-text-muted">Escolha uma intenção, mergulhe no assunto e encontre novas conexões.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">Nova sessão de estudo</h3>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="No que vai focar? (anotação da sessão)" />
          <Button onClick={startSession} disabled={loading}>Iniciar sessão (25 min)</Button>
          <h3 className="font-semibold text-text-primary pt-2">Sua trajetória de estudo</h3>
          <ul className="text-sm text-text-muted space-y-1 max-h-48 overflow-auto">
            {sessions.map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span>{s.type} · {new Date(s.started_at ?? s.created_at).toLocaleString('pt-BR')}</span>
                <Badge variant={s.status === 'completed' ? 'success' : 'warning'}>{s.status}</Badge>
              </li>
            ))}
            {sessions.length === 0 && <li>Nenhuma sessão registrada.</li>}
          </ul>
        </Card>
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">Aprofundar com a LIA</h3>
          <Input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Explique X com base nas minhas fontes..." />
          <Button onClick={askLia} disabled={loading || !ask.trim()}>Perguntar</Button>
          {liaAnswer && <div className="text-sm bg-surface-border/50 rounded-md p-3 whitespace-pre-wrap max-h-64 overflow-auto">{liaAnswer}</div>}
        </Card>
      </div>
    </div>
  );
}

// ---------------- Exams ----------------
export function Exams() {
  const pid = usePid();
  const [exams, setExams] = useState<ExamDef[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState(''); const [duration, setDuration] = useState(60);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<{ exam: ExamDef; attempt: ExamAttempt } | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [left, setLeft] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const load = useCallback(async () => {
    if (!pid) return;
    try {
      const [e, q] = await Promise.all([apiList<ExamDef>(pid, 'exams'), listQuestions(pid)]);
      setExams(e); setQuestions(q);
    } catch (e) { setErr(String(e)); }
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  // timer + autosave a cada 10s
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setLeft((l) => {
        const n = l - 1;
        if (n <= 0 && pid) { void submit(pid, active.exam.id, active.attempt.id); }
        return n;
      });
      if (pid) autosaveAttempt(pid, active.exam.id, active.attempt.id, answersRef.current).catch(() => {});
    }, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit é instável de propósito; estado lido via refs
  }, [active, pid]);

  const create = async () => {
    if (!pid || !title.trim() || selected.length === 0) return;
    try {
      await apiPost(pid, 'exams', { title: title.trim(), duration_minutes: duration, question_ids: selected, status: 'published' });
      setTitle(''); setSelected([]); await load();
    } catch (e) { setErr(String(e)); }
  };
  const start = async (exam: ExamDef) => {
    if (!pid) return;
    try {
      const attempt = await startExamAttempt(pid, exam.id);
      setActive({ exam, attempt });
      setAnswers(attempt.answers ?? {});
      setResult(null);
      setLeft(exam.duration_minutes * 60);
    } catch (e) { setErr(String(e)); }
  };
  const submit = async (p: string, examId: string, attemptId: string) => {
    try {
      const r = await submitExam(p, examId, attemptId, answersRef.current);
      setResult({ score: r.score, maxScore: r.maxScore });
      setActive(null);
      await load();
    } catch (e) { setErr(String(e)); }
  };

  const examQuestions = active ? questions.filter((q) => active.exam.question_ids.includes(q.id)) : [];

  if (active) {
    const mm = Math.floor(Math.max(0, left) / 60); const ss = Math.max(0, left) % 60;
    return (
      <div className="module-workspace space-y-4 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-text-primary">{active.exam.title}</h1>
          <Badge variant={left < 300 ? 'warning' : 'primary'}>{mm}:{String(ss).padStart(2, '0')}</Badge>
        </div>
        <p className="text-xs text-text-muted">Autosalvamento a cada 10s · sem acesso ao gabarito · LIA desativada neste modo</p>
        {examQuestions.map((q, i) => (
          <Card key={q.id} className="p-4 space-y-2">
            <p className="font-medium text-text-primary">{i + 1}. {q.stem}</p>
            <Input
              value={String(answers[q.id] ?? '')}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Sua resposta..."
            />
          </Card>
        ))}
        <Button onClick={() => pid && submit(pid, active.exam.id, active.attempt.id)}>Entregar prova</Button>
        {result && <Card className="p-4 border-success"><p className="font-bold text-success">Resultado: {result.score}/{result.maxScore}</p></Card>}
      </div>
    );
  }

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">UMA CONEXÃO DE CADA VEZ</span>
        <h1 className="text-2xl font-bold text-text-primary">Simulados</h1>
        <p className="text-text-muted">Prepare-se com intenção. Monte uma prova e acompanhe seu desempenho.</p>
      </div>
      {err && <p className="text-sm text-error">{err}</p>}
      <Card className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da prova" className="flex-1 min-w-40" />
          <Input type="number" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))} className="w-24" />
          <Button onClick={create} disabled={!title.trim() || selected.length === 0}>Criar prova</Button>
        </div>
        <div className="max-h-40 overflow-auto space-y-1">
          {questions.map((q) => (
            <label key={q.id} className="flex gap-2 items-center text-sm text-text-primary">
              <input type="checkbox" checked={selected.includes(q.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, q.id] : s.filter((x) => x !== q.id))} />
              {q.subject ? `[${q.subject}] ` : ''}{q.stem.slice(0, 80)}
            </label>
          ))}
          {questions.length === 0 && <p className="text-text-muted text-sm">Adicione questões ao banco para montar seu primeiro simulado.</p>}
        </div>
      </Card>
      <div className="space-y-3">
        {exams.map((e) => (
          <Card key={e.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">{e.title}</h3>
              <p className="text-sm text-text-muted">{e.question_ids.length} questões · {e.duration_minutes} min</p>
            </div>
            <Button onClick={() => start(e)} disabled={e.question_ids.length === 0}>Iniciar</Button>
          </Card>
        ))}
        {exams.length === 0 && <Card className="p-6"><p className="text-text-muted">Nenhuma prova criada.</p></Card>}
      </div>
    </div>
  );
}

// ---------------- Focus ----------------
export function Focus() {
  const pid = usePid();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const startedRef = useRef<string | null>(null);

  // recuperação após reload: restaura timer em andamento
  useEffect(() => {
    try {
      const raw = localStorage.getItem('prisma_focus_timer');
      if (raw) {
        const t = JSON.parse(raw);
        if (t.running && t.endsAt > Date.now()) {
          setSeconds(Math.round((t.endsAt - Date.now()) / 1000));
          setRunning(true);
          startedRef.current = t.startedAt;
        }
      }
    } catch { /* ignore */ }
    if (pid) listSessions(pid).then(setSessions).catch(() => {});
  }, [pid]);

  useEffect(() => {
    if (!running) return;
    const endsAt = Date.now() + seconds * 1000;
    const t = setInterval(() => {
      const left = Math.round((endsAt - Date.now()) / 1000);
      setSeconds(left);
      if (left <= 0) {
        setRunning(false);
        localStorage.removeItem('prisma_focus_timer');
        if (pid && startedRef.current) {
          createSession(pid, {
            type: 'focus', planned_duration: 25, status: 'completed',
            started_at: startedRef.current, ended_at: new Date().toISOString(), actual_duration: 25, notes: 'Pomodoro concluído',
          }).then(() => listSessions(pid).then(setSessions)).catch(() => {});
        }
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timer usa endsAt fixo; seconds só inicia o relógio
  }, [running, pid]);

  const toggle = () => {
    if (!running) {
      const startedAt = new Date().toISOString();
      startedRef.current = startedAt;
      localStorage.setItem('prisma_focus_timer', JSON.stringify({ running: true, endsAt: Date.now() + seconds * 1000, startedAt }));
    } else {
      localStorage.removeItem('prisma_focus_timer');
    }
    setRunning((r) => !r);
  };
  const reset = () => { setRunning(false); setSeconds(25 * 60); localStorage.removeItem('prisma_focus_timer'); };

  const week = sessions.filter((s) => s.type === 'focus' && Date.now() - new Date(s.started_at ?? s.created_at).getTime() < 7 * 864e5);
  const mm = Math.floor(seconds / 60); const ss = seconds % 60;

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">UMA CONEXÃO DE CADA VEZ</span>
        <h1 className="text-2xl font-bold text-text-primary">Um momento para focar.</h1>
        <p className="text-text-muted">Menos distrações. Mais espaço para aprender. Um ciclo de 25 minutos por vez.</p>
      </div>
      <Card className="focus-room p-8 text-center"><span className="section-eyebrow mb-8">PRESENTE NO SEU APRENDIZADO</span><div className="focus-clock">
        <p className="text-6xl font-bold text-text-primary tabular-nums">{mm}:{String(ss).padStart(2, '0')}</p>
        </div><div className="flex gap-2 justify-center mt-8">
          <Button onClick={toggle}>{running ? 'Pausar' : 'Iniciar'}</Button>
          <Button variant="secondary" onClick={reset}>Reiniciar</Button>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-text-primary mb-2">Sessões de foco (últimos 7 dias)</h3>
        <p className="text-3xl font-bold text-accent">{week.length}</p>
        <p className="text-sm text-text-muted">momentos dedicados ao seu aprendizado</p>
      </Card>
    </div>
  );
}
