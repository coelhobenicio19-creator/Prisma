// Recall real: decks + cards devidos via API, revisão com FSRS (rating 1-4).
import { useCallback, useEffect, useState } from 'react';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { listDecks, createDeck, createCard, getDueCards, reviewCard, Flashcard, FlashcardDeck } from '@/services/api';

const RATINGS: { r: 1 | 2 | 3 | 4; label: string; cls: string }[] = [
  { r: 1, label: 'De novo', cls: 'bg-error/10 text-error border-error' },
  { r: 2, label: 'Difícil', cls: 'bg-warning/10 text-warning border-warning' },
  { r: 3, label: 'Bom', cls: 'bg-accent/10 text-accent border-accent' },
  { r: 4, label: 'Fácil', cls: 'bg-success/10 text-success border-success' },
];

export function RecallPage() {
  const pid = useProfileStore((s) => s.currentProfile?.id ?? null);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [deckId, setDeckId] = useState<string>('');
  const [due, setDue] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [done, setDone] = useState(0);
  const [newDeck, setNewDeck] = useState('');
  const [front, setFront] = useState(''); const [back, setBack] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    if (!pid) return;
    try {
      const d = await listDecks(pid);
      setDecks(d);
      if (!deckId && d.length) setDeckId(d[0].id);
    } catch (e) { setError(String(e)); }
  }, [pid, deckId]);

  const loadDue = useCallback(async () => {
    if (!pid) return;
    try {
      const c = await getDueCards(pid, 50);
      setDue(c);
      setCurrent(c[0] ?? null);
      setShowBack(false);
    } catch (e) { setError(String(e)); }
  }, [pid]);

  useEffect(() => { loadDecks(); loadDue(); }, [loadDecks, loadDue]);

  const addDeck = async () => {
    if (!pid || !newDeck.trim()) return;
    try { await createDeck(pid, newDeck.trim()); setNewDeck(''); await loadDecks(); } catch (e) { setError(String(e)); }
  };
  const addCard = async () => {
    if (!pid || !deckId || !front.trim() || !back.trim()) return;
    try { await createCard(pid, deckId, front.trim(), back.trim()); setFront(''); setBack(''); await loadDue(); } catch (e) { setError(String(e)); }
  };
  const rate = async (r: 1 | 2 | 3 | 4) => {
    if (!pid || !current) return;
    try {
      await reviewCard(pid, current.id, r);
      const rest = due.filter((c) => c.id !== current.id);
      setDue(rest); setCurrent(rest[0] ?? null); setShowBack(false); setDone((d) => d + 1);
    } catch (e) { setError(String(e)); }
  };

  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div>
        <span className="section-eyebrow mb-3">APRENDER É CONTINUAR</span>
        <h1 className="text-2xl font-bold text-text-primary">Recall</h1>
        <p className="text-text-muted">Conhecimento que fica. {due.length} revisões esperando · {done} concluídas nesta sessão</p>
      </div>
      {error && <Card className="p-3 border-error"><p className="text-sm text-error">{error}</p></Card>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">Suas coleções</h3>
          <div className="flex gap-2">
            <Input value={newDeck} onChange={(e) => setNewDeck(e.target.value)} placeholder="Nova coleção…" className="flex-1" />
            <Button size="sm" onClick={addDeck} disabled={!newDeck.trim()}>Criar</Button>
          </div>
          <select aria-label="Coleção de flashcards" className="btn w-full" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="space-y-3">
            <Input label="Pergunta" value={front} onChange={(e) => setFront(e.target.value)} placeholder="Frente" className="flex-1" />
            <Input label="Resposta" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Verso" className="flex-1" />
            <Button size="sm" onClick={addCard} disabled={!front.trim() || !back.trim()}>Adicionar flashcard</Button>
          </div>
        </Card>

        <Card className="recall-review p-6 lg:col-span-2 flex flex-col items-center justify-center min-h-[300px]">
          {current ? (
            <>
              <p className="text-lg text-text-primary text-center mb-6">{current.front}</p>
              {showBack && <p className="text-text-muted text-center mb-6 border-t border-border pt-4 w-full">{current.back}</p>}
              {!showBack ? (
                <Button onClick={() => setShowBack(true)}>Mostrar resposta</Button>
              ) : (
                <div className="flex gap-2 flex-wrap justify-center">
                  {RATINGS.map((x) => (
                    <button key={x.r} onClick={() => rate(x.r)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium ${x.cls}`}>
                      {x.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-text-muted">Tudo em dia por aqui. Volte depois ou adicione uma nova conexão à sua coleção.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
