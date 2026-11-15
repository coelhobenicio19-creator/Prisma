// Módulos de conhecimento/criação que faltavam como rota:
// Reader, Compare, Formula, Board — todos com dados reais ou lógica local determinística.
import { useEffect, useRef, useState } from 'react';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { listDocuments, openDocument, liaChat, Document } from '@/services/api';
import { evaluateMath, diffLines } from '@/utils/academic';

function useProfileId(): string | null {
  return useProfileStore((s) => s.currentProfile?.id ?? null);
}

// ---------------- Reader ----------------
export function ReaderPage() {
  const pid = useProfileId();
  const [docs, setDocs] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pid) return;
    listDocuments(pid).then(setDocs).catch(() => {});
  }, [pid]);

  const open = async (d: Document) => {
    setSelected(d); setLoading(true); setAnswer('');
    try { setContent(await openDocument(d.id)); } catch { setContent('(não foi possível extrair o texto deste arquivo)'); }
    finally { setLoading(false); }
  };

  const ask = async () => {
    if (!pid || !question.trim() || !selected) return;
    setLoading(true); setAnswer('');
    try {
      const res = await liaChat(pid, null, `Documento: "${selected.title}"\n\nConteúdo (trecho):\n${content.slice(0, 8000)}\n\nPergunta: ${question}`, (t) => setAnswer((a) => a + t));
      setAnswer(res.full_text);
    } catch (e) { setAnswer(`Erro: ${e}`); } finally { setLoading(false); }
  };

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">EXPLORE NOVAS PERSPECTIVAS</span>
        <h1 className="text-2xl font-bold text-text-primary">Leitor</h1>
        <p className="text-text-muted">Leia com atenção. Faça perguntas e conecte o que você encontra.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1 space-y-2">
          {docs.map((d) => (
            <button key={d.id} onClick={() => open(d)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm ${selected?.id === d.id ? 'bg-accent/10 text-accent' : 'hover:bg-bg-tertiary text-text-primary'}`}>
              {d.title}
            </button>
          ))}
          {docs.length === 0 && <p className="text-text-muted text-sm">Biblioteca vazia — importe um arquivo primeiro.</p>}
        </Card>
        <Card className="p-4 lg:col-span-2 space-y-3">
          {selected ? (
            <>
              <h3 className="font-semibold text-text-primary">{selected.title}</h3>
              <div className="max-h-64 overflow-auto text-sm text-text-muted whitespace-pre-wrap border border-border rounded-md p-3">
                {loading ? 'Carregando...' : content || '(vazio)'}
              </div>
              <div className="flex gap-2">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pergunte sobre este documento..." className="flex-1" />
                <Button onClick={ask} disabled={loading || !question.trim()}>Perguntar</Button>
              </div>
              {answer && <div className="text-sm bg-surface-border/50 rounded-md p-3 whitespace-pre-wrap">{answer}</div>}
            </>
          ) : <p className="text-text-muted">Selecione um documento.</p>}
        </Card>
      </div>
    </div>
  );
}

// ---------------- Compare ----------------
export function ComparePage() {
  const pid = useProfileId();
  const [docs, setDocs] = useState<Document[]>([]);
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [diff, setDiff] = useState<ReturnType<typeof diffLines> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (pid) listDocuments(pid).then(setDocs).catch(() => {}); }, [pid]);

  const compare = async () => {
    if (!a || !b) return;
    setLoading(true);
    try {
      const [ta, tb] = await Promise.all([openDocument(a), openDocument(b)]);
      setDiff(diffLines(ta, tb));
    } catch (e) { setDiff([{ type: 'del', text: `Erro: ${e}` }]); } finally { setLoading(false); }
  };

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">EXPLORE NOVAS PERSPECTIVAS</span>
        <h1 className="text-2xl font-bold text-text-primary">Comparar</h1>
        <p className="text-text-muted">Dois textos, uma nova perspectiva. Veja o que mudou e o que permanece.</p>
      </div>
      <div className="flex gap-2 flex-wrap items-end">
        <select aria-label="Primeiro documento" className="btn" value={a} onChange={(e) => setA(e.target.value)}>
          <option value="">Documento A...</option>
          {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <select aria-label="Segundo documento" className="btn" value={b} onChange={(e) => setB(e.target.value)}>
          <option value="">Documento B...</option>
          {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <Button onClick={compare} disabled={!a || !b || loading}>{loading ? 'Comparando...' : 'Comparar'}</Button>
      </div>
      {diff && (
        <Card className="p-4 max-h-96 overflow-auto text-sm font-mono">
          {diff.map((l, i) => (
            <div key={i} className={l.type === 'add' ? 'bg-success/10 text-success' : l.type === 'del' ? 'bg-error/10 text-error line-through' : 'text-text-muted'}>
              {l.type === 'add' ? '+ ' : l.type === 'del' ? '- ' : '  '}{l.text}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ---------------- Formula ----------------
export function FormulaPage() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('prisma_formula_history') ?? '[]'); } catch { return []; }
  });

  const calc = () => {
    try {
      const r = evaluateMath(expr);
      const line = `${expr} = ${r}`;
      setResult(line);
      setHistory((h) => { const next = [line, ...h].slice(0, 20); localStorage.setItem('prisma_formula_history', JSON.stringify(next)); return next; });
    } catch (e) { setResult(`Erro: ${(e as Error).message}`); }
  };

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">EXPLORE NOVAS PERSPECTIVAS</span>
        <h1 className="text-2xl font-bold text-text-primary">Fórmulas</h1>
        <p className="text-text-muted">Explore expressões e confira seus cálculos, um raciocínio de cada vez.</p>
      </div>
      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="Ex: (3+4)*sqrt(16)/2" className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') calc(); }} />
          <Button onClick={calc}>Calcular</Button>
        </div>
        {result && <p className="font-mono text-lg text-text-primary">{result}</p>}
      </Card>
      {history.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-text-primary mb-2">Histórico</h3>
          <ul className="text-sm text-text-muted font-mono space-y-1">
            {history.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------- Board ----------------
export function BoardPage() {
  const pid = useProfileId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [saved, setSaved] = useState(false);

  const key = `prisma_board_${pid ?? 'anon'}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = localStorage.getItem(key) ?? '';
  }, [pid, key]);

  const pos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.MouseEvent) => { drawing.current = true; const { x, y } = pos(e); const ctx = canvasRef.current!.getContext('2d')!; ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e: React.MouseEvent) => {
    if (!drawing.current) return;
    const { x, y } = pos(e); const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(x, y); ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.stroke();
  };
  const stop = () => { drawing.current = false; };
  const save = () => {
    const data = canvasRef.current?.toDataURL();
    if (data) { localStorage.setItem(key, data); setSaved(true); setTimeout(() => setSaved(false), 1500); }
  };
  const clear = () => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem(key);
  };

  return (
    <div className="module-workspace space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow mb-3">EXPLORE NOVAS PERSPECTIVAS</span>
        <h1 className="text-2xl font-bold text-text-primary">Quadro</h1>
          <p className="text-text-muted">Dê forma às suas ideias. Desenhe, conecte e guarde no seu perfil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={save}>{saved ? 'Salvo ✓' : 'Salvar'}</Button>
          <Button variant="secondary" onClick={clear}>Limpar</Button>
        </div>
      </div>
      <Card className="p-2">
        <canvas ref={canvasRef} width={900} height={500}
          className="w-full border border-border rounded-md cursor-crosshair bg-white"
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} />
      </Card>
    </div>
  );
}
