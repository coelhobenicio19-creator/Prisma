// Studio (editor + export real), Lab (experimentos com cálculo determinístico), Oral (voz + transcrição persistida)
import { useCallback, useEffect, useState } from 'react';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { VoiceControls } from '@/components/VoiceControls';
import { apiList, apiPost, apiPatch, apiDelete, liaChat } from '@/services/api';
import { exportDocs, EXPORT_FORMATS } from '@/services/export';
import { evaluateMath } from '@/utils/academic';

function usePid(): string | null {
  return useProfileStore((s) => s.currentProfile?.id ?? null);
}

interface StudioDoc { id: string; title: string; kind: string; content: string; references: any[]; updated_at: string }
interface LabExp { id: string; title: string; hypothesis?: string | null; steps: any[]; results: any[]; conclusion?: string | null }
interface OralSession { id: string; topic: string; transcript: any[]; evaluation?: any; started_at: string; ended_at?: string | null }

// ---------------- Studio ----------------
export function Studio() {
  const pid = usePid();
  const [docs, setDocs] = useState<StudioDoc[]>([]);
  const [cur, setCur] = useState<StudioDoc | null>(null);
  const [title, setTitle] = useState(''); const [kind, setKind] = useState('note');
  const [content, setContent] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => { if (pid) setDocs(await apiList<StudioDoc>(pid, 'studio/documents')); }, [pid]);
  useEffect(() => { load(); }, [load]);

  // autosave a cada 5s
  useEffect(() => {
    if (!cur || !pid) return;
    const t = setTimeout(async () => {
      await apiPatch(pid, `studio/documents/${cur.id}`, { title: cur.title, content, kind: cur.kind }).catch(() => {});
      setSavedAt(new Date().toLocaleTimeString('pt-BR'));
    }, 5000);
    return () => clearTimeout(t);
  }, [content, cur, pid]);

  const create = async () => {
    if (!pid || !title.trim()) return;
    const d = await apiPost<StudioDoc>(pid, 'studio/documents', { title: title.trim(), kind, content: '', references: [] });
    setTitle(''); await load(); setCur(d); setContent('');
  };
  const open = (d: StudioDoc) => { setCur(d); setContent(d.content); };
  const askSummary = async () => {
    if (!pid || !content.trim()) return;
    const r = await liaChat(pid, null, `Resuma o seguinte texto preservando referências e estrutura:\n\n${content.slice(0, 8000)}`, () => {});
    setContent((c) => c + `\n\n## Resumo (LIA)\n${r.full_text}\n`);
  };

  return (
    <div className="module-workspace space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow mb-3">IDEIAS EM MOVIMENTO</span>
        <h1 className="text-2xl font-bold text-text-primary">Studio</h1>
          <p className="text-text-muted">Um lugar para suas ideias tomarem forma. Escreva, organize e compartilhe.</p>
        </div>
        <div className="flex gap-2">
          <select aria-label="Tipo de documento" className="btn" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="note">Anotação</option><option value="summary">Resumo</option><option value="essay">Trabalho</option><option value="slides">Slides</option>
          </select>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título..." className="w-48" />
          <Button onClick={create} disabled={!title.trim()}>Novo</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-3 space-y-1 lg:col-span-1 max-h-96 overflow-auto">
          {docs.map((d) => (
            <button key={d.id} onClick={() => open(d)} className={`block w-full text-left px-2 py-1.5 rounded text-sm ${cur?.id === d.id ? 'bg-accent/10 text-accent' : 'hover:bg-bg-tertiary text-text-primary'}`}>
              {d.title} <Badge variant="neutral">{d.kind}</Badge>
            </button>
          ))}
          {docs.length === 0 && <p className="text-text-muted text-sm">Nenhum documento.</p>}
        </Card>
        <Card className="p-4 lg:col-span-3">
          {cur ? (
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold text-text-primary flex-1">{cur.title}</h3>
                {savedAt && <span className="text-xs text-text-muted">salvo {savedAt}</span>}
                <Button size="sm" variant="secondary" onClick={askSummary}>Resumo LIA</Button>
                {EXPORT_FORMATS.map((f) => (
                  <Button key={f} size="sm" variant="secondary" onClick={() => exportDocs([{ title: cur.title, content, tags: [cur.kind] }] as any, f)}>{f.toUpperCase()}</Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => pid && apiDelete(pid, `studio/documents/${cur.id}`).then(() => { setCur(null); load(); })}>🗑</Button>
              </div>
              <textarea
                className="editor-canvas w-full min-h-[400px] bg-surface border border-border rounded-md p-3 text-sm text-text-primary font-mono"
                value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva aqui... (markdown aceito na exportação)"
              />
            </>
          ) : <p className="text-text-muted">Abra ou crie um documento.</p>}
        </Card>
      </div>
    </div>
  );
}

// ---------------- Lab ----------------
export function Lab() {
  const pid = usePid();
  const [exps, setExps] = useState<LabExp[]>([]);
  const [cur, setCur] = useState<LabExp | null>(null);
  const [title, setTitle] = useState(''); const [expr, setExpr] = useState(''); const [label, setLabel] = useState('');

  const load = useCallback(async () => { if (pid) setExps(await apiList<LabExp>(pid, 'lab/experiments')); }, [pid]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!pid || !title.trim()) return;
    const e = await apiPost<LabExp>(pid, 'lab/experiments', { title: title.trim(), hypothesis: '', steps: [], results: [] });
    setTitle(''); await load(); setCur(e);
  };
  const addResult = async () => {
    if (!pid || !cur || !expr.trim()) return;
    let value: number | string; const simulated = false; let error: string | null = null;
    try { value = evaluateMath(expr); } catch (e) { error = (e as Error).message; value = `erro: ${error}`; }
    // cálculo local determinístico = resultado real da expressão; "simulado" só se marcado
    const results = [...(cur.results ?? []), { label: label || expr, expression: expr, value, simulated, error }];
    const updated = await apiPatch<LabExp>(pid, `lab/experiments/${cur.id}`, { results });
    setCur(updated); await load();
    setExpr(''); setLabel('');
  };

  return (
    <div className="module-workspace space-y-4 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">IDEIAS EM MOVIMENTO</span>
        <h1 className="text-2xl font-bold text-text-primary">Laboratório</h1>
        <p className="text-text-muted">Investigue uma hipótese. Registre etapas e acompanhe suas descobertas.</p>
      </div>
      <div className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Novo experimento..." className="flex-1" />
        <Button onClick={create} disabled={!title.trim()}>Criar</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-3 space-y-1">
          {exps.map((e) => (
            <button key={e.id} onClick={() => setCur(e)} className={`block w-full text-left px-2 py-1.5 rounded text-sm ${cur?.id === e.id ? 'bg-accent/10 text-accent' : 'hover:bg-bg-tertiary text-text-primary'}`}>{e.title}</button>
          ))}
          {exps.length === 0 && <p className="text-text-muted text-sm">Nenhum experimento.</p>}
        </Card>
        <Card className="p-4 lg:col-span-2 space-y-3">
          {cur ? (
            <>
              <h3 className="font-semibold text-text-primary">{cur.title}</h3>
              <div className="flex gap-2">
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo" className="w-36" />
                <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="Expressão: ex (9.8*2^2)/2" className="flex-1" />
                <Button size="sm" onClick={addResult} disabled={!expr.trim()}>Calcular</Button>
              </div>
              <ul className="text-sm space-y-1">
                {(cur.results ?? []).map((r, i) => (
                  <li key={i} className="font-mono text-text-primary">
                    {r.label}: {r.expression} = <span className="font-bold text-accent">{String(r.value)}</span>
                    {r.simulated && <Badge variant="warning">simulado</Badge>}
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-text-muted">Selecione um experimento.</p>}
        </Card>
      </div>
    </div>
  );
}

// ---------------- Oral ----------------
export function Oral() {
  const pid = usePid();
  const [sessions, setSessions] = useState<OralSession[]>([]);
  const [cur, setCur] = useState<OralSession | null>(null);
  const [topic, setTopic] = useState('');
  const [transcript, setTranscript] = useState<any[]>([]);
  const [clarity, setClarity] = useState(0.5); const [precision, setPrecision] = useState(0.5); const [completeness, setCompleteness] = useState(0.5);

  const load = useCallback(async () => { if (pid) setSessions(await apiList<OralSession>(pid, 'oral/sessions')); }, [pid]);
  useEffect(() => { load(); }, [load]);

  const start = async () => {
    if (!pid || !topic.trim()) return;
    const s = await apiPost<OralSession>(pid, 'oral/sessions', { topic: topic.trim(), transcript: [] });
    setCur(s); setTranscript([]); await load();
  };
  const addTurn = async (role: 'user' | 'lia', text: string) => {
    if (!pid || !cur || !text.trim()) return;
    const next = [...transcript, { role, text: text.trim(), at: new Date().toISOString() }];
    setTranscript(next);
    await apiPatch(pid, `oral/sessions/${cur.id}`, { transcript: next });
  };
  const finish = async () => {
    if (!pid || !cur) return;
    const evaluation = { clareza: clarity, precisao: precision, completude: completeness, nota: Math.round(((clarity + precision + completeness) / 3) * 100) / 10 };
    const s = await apiPatch<OralSession>(pid, `oral/sessions/${cur.id}`, { evaluation, ended_at: new Date().toISOString() });
    setCur(s); await load();
  };

  return (
    <div className="module-workspace space-y-4 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">IDEIAS EM MOVIMENTO</span>
        <h1 className="text-2xl font-bold text-text-primary">Banca oral</h1>
        <p className="text-text-muted">Organize o raciocínio e encontre sua voz. Pratique explicar o que aprendeu.</p>
      </div>
      <div className="flex gap-2 items-center">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema da prática oral..." className="flex-1" />
        <Button onClick={start} disabled={!topic.trim()}>Iniciar</Button>
        <VoiceControls onTranscript={(t) => addTurn('user', t)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-3 space-y-1">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => { setCur(s); setTranscript(s.transcript ?? []); }}
              className={`block w-full text-left px-2 py-1.5 rounded text-sm ${cur?.id === s.id ? 'bg-accent/10 text-accent' : 'hover:bg-bg-tertiary text-text-primary'}`}>
              {s.topic} {s.evaluation && <Badge variant="success">{s.evaluation.nota}</Badge>}
            </button>
          ))}
          {sessions.length === 0 && <p className="text-text-muted text-sm">Nenhuma sessão oral.</p>}
        </Card>
        <Card className="p-4 lg:col-span-2 space-y-3">
          {cur ? (
            <>
              <h3 className="font-semibold text-text-primary">{cur.topic}</h3>
              <div className="max-h-64 overflow-auto space-y-2 text-sm">
                {transcript.map((t, i) => (
                  <p key={i} className={t.role === 'user' ? 'text-text-primary' : 'text-accent'}><b>{t.role === 'user' ? 'Você' : 'LIA'}:</b> {t.text}</p>
                ))}
                {transcript.length === 0 && <p className="text-text-muted">Use o microfone ou escreva abaixo.</p>}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Sua fala (texto)..." className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { addTurn('user', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
              </div>
              {cur.ended_at ? (
                <p className="text-sm">Avaliação: clareza {cur.evaluation?.clareza}, precisão {cur.evaluation?.precisao}, completude {cur.evaluation?.completude} → <b>{cur.evaluation?.nota}</b>/100</p>
              ) : (
                <div className="space-y-2">
                  {([
                    ['Clareza', clarity, setClarity],
                    ['Precisão', precision, setPrecision],
                    ['Completude', completeness, setCompleteness],
                  ] as Array<[string, number, (v: number) => void]>).map(([l, v, set]) => (
                    <label key={l} className="flex items-center gap-2 text-sm text-text-muted">
                      {l} <input type="range" min={0} max={1} step={0.05} value={v} onChange={(e) => set(Number(e.target.value))} className="flex-1" />
                    </label>
                  ))}
                  <Button size="sm" onClick={finish}>Finalizar e avaliar</Button>
                </div>
              )}
            </>
          ) : <p className="text-text-muted">Inicie uma sessão.</p>}
        </Card>
      </div>
    </div>
  );
}
