// Planner (tarefas + compromissos), Projects (projetos + subtarefas), Forecast (estimativa real)
// School foi removido do sistema (decisão do usuário) — ver migration 005.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  apiList, apiPost, apiPatch, apiDelete,
  listCommitments, listQuestions, listSessions, getDueCards,
} from '@/services/api';
import { accuracyPercent, forecast } from '@/utils/academic';

function usePid(): string | null {
  return useProfileStore((s) => s.currentProfile?.id ?? null);
}

interface Task { id: string; title: string; description?: string | null; due_at?: string | null; priority: string; status: string; subject?: string | null; estimated_minutes?: number | null; completed_at?: string | null }
interface Project { id: string; title: string; description?: string | null; status: string; due_at?: string | null }
interface ProjectTask { id: string; project_id: string; title: string; done: boolean; position: number; due_at?: string | null }

// ---------------- Planner ----------------
export function Planner() {
  const pid = usePid();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState(''); const [subject, setSubject] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pid) return;
    try {
      const [t, c] = await Promise.all([apiList<Task>(pid, 'planner/tasks'), listCommitments(pid)]);
      setTasks(t); setCommitments(c);
    } catch (e) { setErr(String(e)); }
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!pid || !title.trim()) return;
    try {
      await apiPost(pid, 'planner/tasks', { title: title.trim(), priority, due_at: due || null, subject: subject || null, status: 'todo' });
      setTitle(''); setDue(''); setSubject(''); await load();
    } catch (e) { setErr(String(e)); }
  };
  const setStatus = async (t: Task, status: string) => {
    if (!pid) return;
    await apiPatch(pid, `planner/tasks/${t.id}`, { status, completed_at: status === 'done' ? new Date().toISOString() : null });
    await load();
  };

  const byStatus = (s: string) => tasks.filter((t) => t.status === s);
  const prioCls = (p: string) => p === 'high' ? 'border-error text-error' : p === 'medium' ? 'border-warning text-warning' : 'border-border text-text-muted';

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">ESPAÇO PARA O QUE IMPORTA</span>
        <h1 className="text-2xl font-bold text-text-primary">Planner</h1>
        <p className="text-text-muted">Abra espaço para o que importa. Organize seus próximos passos de estudo.</p>
      </div>
      <Card className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa..." className="flex-1 min-w-48" />
          <select aria-label="Prioridade da tarefa" className="btn" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">baixa</option><option value="medium">média</option><option value="high">alta</option>
          </select>
          <Input aria-label="Prazo da tarefa" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-44" />
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Disciplina" className="w-36" />
          <Button onClick={add} disabled={!title.trim()}>Adicionar</Button>
        </div>
        {err && <p className="text-sm text-error">{err}</p>}
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[['todo', 'A fazer'], ['in_progress', 'Em andamento'], ['done', 'Concluídas']].map(([s, label]) => (
          <Card key={s} className="p-4">
            <h3 className="font-semibold text-text-primary mb-3">{label} ({byStatus(s).length})</h3>
            <div className="space-y-2">
              {byStatus(s).map((t) => (
                <div key={t.id} className={`p-2 rounded-md border ${prioCls(t.priority)}`}>
                  <p className="text-sm font-medium text-text-primary">{t.title}</p>
                  <div className="flex gap-2 mt-1 flex-wrap items-center">
                    {t.due_at && <span className="text-xs text-text-muted">até {new Date(t.due_at).toLocaleDateString('pt-BR')}</span>}
                    {t.subject && <Badge variant="neutral">{t.subject}</Badge>}
                    <span className="flex-1" />
                    {s === 'todo' && <Button size="sm" variant="ghost" onClick={() => setStatus(t, 'in_progress')}>▶</Button>}
                    {s === 'in_progress' && <Button size="sm" variant="ghost" onClick={() => setStatus(t, 'done')}>✓</Button>}
                    {s === 'done' && <Button size="sm" variant="ghost" onClick={() => setStatus(t, 'todo')}>↺</Button>}
                    <Button size="sm" variant="ghost" onClick={() => pid && apiDelete(pid, `planner/tasks/${t.id}`).then(load)}>🗑</Button>
                  </div>
                </div>
              ))}
              {byStatus(s).length === 0 && <p className="text-sm text-text-muted">Um espaço para seu próximo passo.</p>}
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <h3 className="font-semibold text-text-primary mb-2">Próximos compromissos (calendário)</h3>
        <ul className="text-sm text-text-muted space-y-1">
          {commitments.slice(0, 8).map((c) => (
            <li key={c.id}>{new Date(c.start_at).toLocaleString('pt-BR')} — {c.title} ({c.type})</li>
          ))}
          {commitments.length === 0 && <li>Nenhum compromisso.</li>}
        </ul>
      </Card>
    </div>
  );
}

// ---------------- Projects ----------------
export function Projects() {
  const pid = usePid();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sel, setSel] = useState<Project | null>(null);
  const [ptasks, setPTasks] = useState<ProjectTask[]>([]);
  const [title, setTitle] = useState(''); const [taskTitle, setTaskTitle] = useState('');

  const load = useCallback(async () => {
    if (!pid) return;
    setProjects(await apiList<Project>(pid, 'projects'));
  }, [pid]);
  const loadTasks = useCallback(async () => {
    if (!pid || !sel) return;
    setPTasks(await apiList<ProjectTask>(pid, `projects/${sel.id}/tasks`));
  }, [pid, sel]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  const addProject = async () => {
    if (!pid || !title.trim()) return;
    await apiPost(pid, 'projects', { title: title.trim(), status: 'active' });
    setTitle(''); await load();
  };
  const addTask = async () => {
    if (!pid || !sel || !taskTitle.trim()) return;
    await apiPost(pid, `projects/${sel.id}/tasks`, { project_id: sel.id, title: taskTitle.trim(), done: false, position: ptasks.length });
    setTaskTitle(''); await loadTasks();
  };
  const toggleTask = async (t: ProjectTask) => {
    if (!pid || !sel) return;
    await apiPatch(pid, `projects/${sel.id}/tasks/${t.id}`, { done: !t.done });
    await loadTasks();
  };

  const donePct = sel && ptasks.length ? Math.round((ptasks.filter((t) => t.done).length / ptasks.length) * 100) : 0;

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">ESPAÇO PARA O QUE IMPORTA</span>
        <h1 className="text-2xl font-bold text-text-primary">Projetos</h1>
        <p className="text-text-muted">Das primeiras ideias à entrega. Acompanhe cada etapa do seu projeto.</p>
      </div>
      <Card className="p-4 flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Novo projeto..." className="flex-1" />
        <Button onClick={addProject} disabled={!title.trim()}>Criar</Button>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2 lg:col-span-1">
          {projects.map((p) => (
            <button key={p.id} onClick={() => setSel(p)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm ${sel?.id === p.id ? 'bg-accent/10 text-accent' : 'hover:bg-bg-tertiary text-text-primary'}`}>
              {p.title} <Badge variant={p.status === 'done' ? 'success' : 'primary'}>{p.status}</Badge>
            </button>
          ))}
          {projects.length === 0 && <p className="text-text-muted text-sm">Nenhum projeto.</p>}
        </Card>
        <Card className="p-4 lg:col-span-2">
          {sel ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">{sel.title}</h3>
                <span className="text-sm font-bold text-accent">{donePct}%</span>
              </div>
              <div className="h-2 bg-surface-border rounded-full overflow-hidden mb-3">
                <div className="h-full bg-accent transition-all" style={{ width: `${donePct}%` }} />
              </div>
              <div className="flex gap-2 mb-3">
                <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Subtarefa..." className="flex-1" />
                <Button size="sm" onClick={addTask} disabled={!taskTitle.trim()}>+</Button>
              </div>
              <ul className="space-y-1">
                {ptasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
                    <span className={t.done ? 'line-through text-text-muted' : 'text-text-primary'}>{t.title}</span>
                  </li>
                ))}
                {ptasks.length === 0 && <li className="text-text-muted">Sem subtarefas.</li>}
              </ul>
            </>
          ) : <p className="text-text-muted">Selecione um projeto.</p>}
        </Card>
      </div>
    </div>
  );
}

// ---------------- Forecast ----------------
export function Forecast() {
  const pid = usePid();
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [due, setDue] = useState(0);

  useEffect(() => {
    if (!pid) return;
    listQuestions(pid).then(setQuestions).catch(() => {});
    listSessions(pid).then(setSessions).catch(() => {});
    getDueCards(pid, 500).then((c) => setDue(c.length)).catch(() => {});
  }, [pid]);

  const f = useMemo(() => {
    const seen = questions.reduce((s, q) => s + (q.times_seen ?? 0), 0);
    const correct = questions.reduce((s, q) => s + (q.times_correct ?? 0), 0);
    const accuracy = seen > 0 ? correct / seen : 0;
    // cobertura: disciplinas com questões / total de disciplinas nos nós do atlas seria ideal;
    // aqui usamos disciplinas vistas como proxy real
    const subjects = new Set(questions.map((q) => q.subject).filter(Boolean)).size;
    const coverage = Math.min(1, subjects / 10); // meta arbitrária documentada: 10 áreas
    const hours = sessions.reduce((s, x) => s + (Number(x.actual_duration ?? x.planned_duration ?? 0) || 0), 0) / 60;
    return forecast({
      accuracy, coverage,
      hoursAvailable: Math.max(0, 40 - hours),       // assume 40h/semana disponíveis (documentado)
      hoursNeededEstimate: Math.max(1, (1 - coverage) * 60),
      sampleSize: seen,
    });
  }, [questions, sessions]);

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">ESPAÇO PARA O QUE IMPORTA</span>
        <h1 className="text-2xl font-bold text-text-primary">Previsão</h1>
        <p className="text-text-muted">Entenda sua preparação com base na prática, nas revisões e no tempo de estudo.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-text-muted">Precisão real</p><p className="text-3xl font-bold text-text-primary">{accuracyPercent(questions.reduce((s, q) => s + (q.times_correct ?? 0), 0), questions.reduce((s, q) => s + (q.times_seen ?? 0), 0))}%</p></Card>
        <Card className="p-4"><p className="text-sm text-text-muted">Questões respondidas</p><p className="text-3xl font-bold text-text-primary">{questions.reduce((s, q) => s + (q.times_seen ?? 0), 0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-text-muted">Revisões devidas</p><p className="text-3xl font-bold text-text-primary">{due}</p></Card>
        <Card className="p-4"><p className="text-sm text-text-muted">Horas registradas</p><p className="text-3xl font-bold text-text-primary">{Math.round(sessions.reduce((s, x) => s + (Number(x.actual_duration ?? x.planned_duration ?? 0) || 0), 0) / 60 * 10) / 10}h</p></Card>
      </div>
      <Card className="p-6 border-l-4 border-accent">
        <h3 className="font-semibold text-text-primary mb-1">Nota estimada: <span className="text-2xl font-bold text-accent">{f.expectedScore.toFixed(1)}</span>/100</h3>
        <Badge variant={f.uncertainty === 'alta' ? 'warning' : f.uncertainty === 'média' ? 'primary' : 'success'}>incerteza: {f.uncertainty}</Badge>
        <p className="text-sm text-text-muted mt-2">{f.note}</p>
        {!f.sufficientData && <p className="text-sm text-warning mt-1">⚠ Dados insuficientes — faça mais questões/simulados para reduzir a incerteza.</p>}
        <p className="text-xs text-text-muted mt-3">Metodologia: expected = precisão × (0.5 + 0.5 × cobertura), ajustada por tempo disponível vs. necessário. Sem IA — fórmula fixa e auditável (api/_lib/academic.ts + utils/academic.ts).</p>
      </Card>
    </div>
  );
}
