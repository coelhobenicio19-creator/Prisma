import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Network,
  X,
  ArrowUpRight,
  Play,
  CalendarPlus,
  Layers,
  Sparkles,
  Trash2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useProfileStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Atlas3DGraph } from "@/components/Atlas3DGraph";
import {
  apiList,
  apiPost,
  apiDelete,
  listQuestions,
  getDueCards,
  createSession,
  liaChat,
  listDecks,
  createDeck,
  createCard,
  Question,
} from "@/services/api";
import { deriveNodeState, STATE_COLORS, NodeState } from "@/utils/atlas";
import { filterAtlasNodes, visibleAtlasEdges } from "@/utils/atlas-view";
import "@/styles/atlas.css";

type ViewMode =
  "graph" | "subject" | "priority" | "difficulty" | "frequency" | "timeline";
const views: { id: ViewMode; label: string }[] = [
  { id: "graph", label: "Mapa 3D" },
  { id: "subject", label: "Disciplinas" },
  { id: "priority", label: "Prioridade" },
  { id: "difficulty", label: "Dificuldade" },
  { id: "frequency", label: "Incidência" },
  { id: "timeline", label: "Evolução" },
];
interface AtlasNode {
  id: string;
  subject: string;
  topic: string;
  mastery: number;
  last_practiced?: string | null;
  source_question_count: number;
  source?: string;
}
interface AtlasEdge {
  id: string;
  from_node: string;
  to_node: string;
}
interface Task {
  id: string;
  subject?: string;
}
const percent = (value: number) =>
  Math.round(Math.max(0, Math.min(1, value || 0)) * 100);

export function AtlasHub() {
  const pid = useProfileStore((state) => state.currentProfile?.id ?? null);
  const [nodes, setNodes] = useState<AtlasNode[]>([]);
  const [edges, setEdges] = useState<AtlasEdge[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("graph");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [liaNote, setLiaNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const createDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    if (!pid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [n, e, q, d, t] = await Promise.all([
        apiList<AtlasNode>(pid, "atlas/nodes"),
        apiList<AtlasEdge>(pid, "atlas/edges"),
        listQuestions(pid),
        getDueCards(pid, 500),
        apiList<Task>(pid, "planner/tasks"),
      ]);
      setNodes(n);
      setEdges(e);
      setQuestions(q);
      setDueCount(d.length);
      setTasks(t);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar seu Atlas. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [pid]);
  useEffect(() => {
    setNodes([]);
    setEdges([]);
    setQuestions([]);
    setTasks([]);
    setDueCount(0);
    setSelected(null);
    setLiaNote("");
    void load();
  }, [load]);
  const stats = useMemo(() => {
    const map = new Map<
      string,
      { seen: number; correct: number; errors: number }
    >();
    questions.forEach((q) => {
      if (!q.topic) return;
      const key = `${q.subject ?? ""}::${q.topic}`;
      const old = map.get(key) ?? { seen: 0, correct: 0, errors: 0 };
      old.seen += q.times_seen;
      old.correct += q.times_correct;
      old.errors += q.times_seen > q.times_correct ? 1 : 0;
      map.set(key, old);
    });
    return map;
  }, [questions]);
  const states = useMemo<Record<string, NodeState>>(
    () =>
      Object.fromEntries(
        nodes.map((node) => {
          const stat = stats.get(`${node.subject}::${node.topic}`);
          return [
            node.id,
            deriveNodeState({
              mastery: node.mastery ?? 0,
              seen: stat?.seen ?? 0,
              accuracy: stat?.seen ? stat.correct / stat.seen : null,
              dueReviews: 0,
              errorCount: stat?.errors ?? 0,
              prereqPending: edges.some(
                (edge) =>
                  edge.to_node === node.id &&
                  (nodes.find((other) => other.id === edge.from_node)
                    ?.mastery ?? 0) < 0.5,
              ),
            }),
          ];
        }),
      ),
    [nodes, edges, stats],
  );
  const filtered = useMemo(
    () => filterAtlasNodes(nodes, query, filter),
    [nodes, query, filter],
  );
  const visibleEdges = useMemo(
    () => visibleAtlasEdges(edges, filtered),
    [edges, filtered],
  );
  const subjects = useMemo(
    () =>
      [...new Set(nodes.map((node) => node.subject))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [nodes],
  );
  useEffect(() => {
    if (selected && !filtered.some((node) => node.id === selected)) {
      setSelected(null);
      setLiaNote("");
    }
  }, [filtered, selected]);
  const selectedNode = nodes.find((node) => node.id === selected);
  const selectedStats = selectedNode
    ? stats.get(`${selectedNode.subject}::${selectedNode.topic}`)
    : undefined;
  const selectedEdges = edges.filter(
    (edge) => edge.from_node === selected || edge.to_node === selected,
  );
  const selectedQuestions = selectedNode
    ? questions.filter(
        (q) =>
          q.subject === selectedNode.subject && q.topic === selectedNode.topic,
      )
    : [];
  const sorted = useMemo(() => {
    const list = [...filtered];
    const accuracy = (node: AtlasNode) => {
      const value = stats.get(`${node.subject}::${node.topic}`);
      return value?.seen ? value.correct / value.seen : 1;
    };
    const rank = (node: AtlasNode) =>
      states[node.id] === "dificuldade"
        ? 0
        : states[node.id] === "pré-requisito pendente"
          ? 1
          : 2;
    if (view === "priority")
      list.sort((a, b) => rank(a) - rank(b) || a.mastery - b.mastery);
    if (view === "difficulty") list.sort((a, b) => accuracy(a) - accuracy(b));
    if (view === "frequency")
      list.sort(
        (a, b) =>
          (stats.get(`${b.subject}::${b.topic}`)?.seen ?? 0) -
          (stats.get(`${a.subject}::${a.topic}`)?.seen ?? 0),
      );
    if (view === "timeline")
      list.sort(
        (a, b) =>
          new Date(b.last_practiced ?? 0).getTime() -
          new Date(a.last_practiced ?? 0).getTime(),
      );
    return list;
  }, [filtered, stats, states, view]);
  const select = (id: string | null) => {
    setSelected(id);
    setLiaNote("");
  };
  const action = async (
    name: string,
    work: () => Promise<unknown>,
    success: string,
  ) => {
    if (busy) return;
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await work();
      setMessage(success);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a ação. Tente novamente.",
      );
    } finally {
      setBusy("");
    }
  };
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pid || !subject.trim() || !topic.trim()) return;
    await action(
      "create",
      async () => {
        await apiPost(pid, "atlas/nodes", {
          subject: subject.trim(),
          topic: topic.trim(),
          mastery: 0,
        });
        setSubject("");
        setTopic("");
        createDialog.current?.close();
        await load();
      },
      "Conteúdo adicionado ao seu Atlas.",
    );
  };
  const study = () => {
    if (!pid || !selectedNode) return;
    void action(
      "study",
      () =>
        createSession(pid, {
          type: "learn",
          planned_duration: 25,
          status: "in_progress",
          started_at: new Date().toISOString(),
          notes: `Atlas: ${selectedNode.subject} · ${selectedNode.topic}`,
        }),
      `Sessão de 25 minutos iniciada para ${selectedNode.topic}. Continue em Aprender.`,
    );
  };
  const planner = () => {
    if (!pid || !selectedNode) return;
    void action(
      "planner",
      async () => {
        await apiPost(pid, "planner/tasks", {
          title: `Estudar ${selectedNode.topic}`,
          subject: selectedNode.subject,
          priority: "high",
          status: "todo",
        });
        await load();
      },
      "Estudo adicionado ao Planner.",
    );
  };
  const flashcard = () => {
    if (!pid || !selectedNode) return;
    void action(
      "recall",
      async () => {
        const decks = await listDecks(pid);
        const deckId = decks[0]?.id ?? (await createDeck(pid, "Atlas")).id;
        await createCard(
          pid,
          deckId,
          `Conceito: ${selectedNode.topic} (${selectedNode.subject})`,
          `Explique ${selectedNode.topic} e dê um exemplo.`,
        );
      },
      "Flashcard criado. Você pode completá-lo no Recall.",
    );
  };
  const ask = () => {
    if (!pid || !selectedNode) return;
    setLiaNote("");
    void action(
      "lia",
      async () => {
        const result = await liaChat(
          pid,
          null,
          `Sobre o tópico "${selectedNode.topic}" (${selectedNode.subject}), domínio atual ${percent(selectedNode.mastery)}%: explique em 3 parágrafos, dê 1 exemplo e sugira 2 exercícios.`,
          (text) => setLiaNote((old) => old + text),
        );
        setLiaNote(result.full_text);
      },
      "Resumo LIA concluído.",
    );
  };
  const remove = () => {
    if (!pid || !selectedNode) return;
    void action(
      "delete",
      async () => {
        await apiDelete(pid, `atlas/nodes/${selectedNode.id}`);
        setSelected(null);
        deleteDialog.current?.close();
        await load();
      },
      "Conteúdo removido do Atlas.",
    );
  };
  const mastered = nodes.filter((node) => node.mastery >= 0.8).length;
  const average = nodes.length
    ? percent(
        nodes.reduce((sum, node) => sum + (node.mastery ?? 0), 0) /
          nodes.length,
      )
    : 0;
  const empty = !loading && nodes.length === 0;

  return (
    <div className="atlas-workspace animate-fade-in">
      <div className="atlas-heading">
        <div>
          <span className="section-eyebrow">CONHECIMENTO EM EXPANSÃO</span>
          <h1>Seu Atlas.</h1>
          <p>Encontre conexões. Descubra caminhos. Veja o que vem a seguir.</p>
        </div>
        <div className="atlas-summary">
          <div>
            <strong>{nodes.length.toString().padStart(2, "0")}</strong>
            <span>tópicos conectados</span>
          </div>
          <div>
            <strong className="text-accent">
              {average}
              <small className="text-sm">%</small>
            </strong>
            <span>domínio médio</span>
          </div>
          <div>
            <strong>{mastered.toString().padStart(2, "0")}</strong>
            <span>dominados</span>
          </div>
        </div>
      </div>
      <div className="atlas-toolbar">
        <div className="atlas-filters">
          <div className="atlas-search">
            <Search />
            <input
              aria-label="Buscar tópico no Atlas"
              placeholder="Encontre uma conexão…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar por disciplina"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setError("");
            createDialog.current?.showModal();
          }}
          disabled={!pid}
        >
          <Plus size={13} />
          Adicionar conteúdo
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="atlas-mode" aria-label="Visualização do Atlas">
          {views.map((item) => (
            <button
              key={item.id}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="text-[9px] text-text-muted">
          {filtered.length} de {nodes.length} tópicos
          {dueCount > 0
            ? ` · ${dueCount} ${dueCount === 1 ? "revisão" : "revisões"} no perfil`
            : ""}
        </span>
      </div>
      {error && (
        <div
          role="alert"
          className="atlas-status !bg-error/10 text-error flex items-center justify-between gap-4"
        >
          <span>{error}</span>
          <button
            aria-label="Recarregar Atlas"
            className="icon-button"
            onClick={() => void load()}
          >
            <RefreshCw />
          </button>
        </div>
      )}
      {message && (
        <div
          role="status"
          className="atlas-status flex items-center justify-between gap-3"
        >
          <span>{message}</span>
          <button aria-label="Fechar mensagem" onClick={() => setMessage("")}>
            <X size={12} />
          </button>
        </div>
      )}
      <div className={`atlas-stage ${selectedNode ? "has-selection" : ""}`}>
        <div className="atlas-map-panel">
          {loading ? (
            <div role="status" className="atlas-empty">
              <Network size={36} className="animate-pulse" />
              <h2>Conectando seu universo…</h2>
              <p>Carregando tópicos, relações e seu progresso.</p>
            </div>
          ) : !pid ? (
            <div className="atlas-empty">
              <Network size={36} />
              <h2>Seu universo começa com você.</h2>
              <p>
                Configure um perfil para reunir seus conteúdos e acompanhar seu
                aprendizado.
              </p>
              <Button asChild size="sm">
                <Link to="/onboarding">
                  Configurar perfil <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          ) : empty ? (
            <div className="atlas-empty">
              <Network size={43} strokeWidth={1} />
              <span className="section-eyebrow">A PRIMEIRA CONEXÃO</span>
              <h2>Uma ideia já é um começo.</h2>
              <p>
                Adicione sua primeira disciplina e um tópico. Seu mapa cresce a
                cada novo conteúdo.
              </p>
              <Button
                size="sm"
                onClick={() => createDialog.current?.showModal()}
              >
                <Plus size={13} />
                Criar primeira conexão
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="atlas-empty">
              <Search size={30} />
              <h2>Nenhuma conexão encontrada.</h2>
              <p>Experimente outro termo ou amplie o filtro de disciplina.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilter("");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : view === "graph" ? (
            <Atlas3DGraph
              nodes={filtered}
              edges={visibleEdges}
              states={states}
              selectedId={selected}
              onSelect={select}
            />
          ) : (
            <div className="atlas-topics min-h-[420px] py-3">
              <p className="text-[9px] text-text-muted py-3">
                {view === "timeline"
                  ? "Última prática registrada, da mais recente à mais antiga."
                  : view === "difficulty"
                    ? "Menor taxa de acerto primeiro. Sem respostas, a dificuldade ainda não é conhecida."
                    : view === "priority"
                      ? "Dificuldades e pré-requisitos primeiro; depois, menor domínio."
                      : view === "frequency"
                        ? "Ordenado pelo número de vezes que as questões foram respondidas."
                        : "Tópicos agrupados por disciplina."}
              </p>
              {(view === "subject"
                ? subjects.filter((item) =>
                    filtered.some((node) => node.subject === item),
                  )
                : [""]
              ).map((group) => (
                <div key={group}>
                  {group && (
                    <h2 className="text-[10px] text-accent uppercase tracking-widest mt-6 mb-2">
                      {group}
                    </h2>
                  )}
                  {sorted
                    .filter((node) => !group || node.subject === group)
                    .map((node) => (
                      <button
                        key={node.id}
                        onClick={() => select(node.id)}
                        aria-pressed={selected === node.id}
                      >
                        <i
                          className="topic-dot"
                          style={{ background: STATE_COLORS[states[node.id]] }}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{node.topic}</span>
                          <small>
                            {node.subject} · {states[node.id]}
                            {view === "timeline"
                              ? ` · ${node.last_practiced ? new Date(node.last_practiced).toLocaleDateString("pt-BR") : "Ainda não praticado"}`
                              : view === "frequency"
                                ? ` · ${stats.get(`${node.subject}::${node.topic}`)?.seen ?? 0} respostas`
                                : ""}
                          </small>
                        </span>
                        <span className="font-mono text-[10px] text-accent">
                          {percent(node.mastery)}%
                        </span>
                        <ArrowUpRight size={12} className="text-text-muted" />
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
          <div className="atlas-legend">
            {Object.entries(STATE_COLORS).map(([label, color]) => (
              <span key={label}>
                <i style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        {selectedNode && (
          <aside className="atlas-inspector" aria-label="Detalhes do tópico">
            <div className="flex items-center justify-between gap-2">
              <span className="section-eyebrow">{selectedNode.subject}</span>
              <button
                className="icon-button !w-6 !h-6"
                aria-label="Fechar detalhes"
                onClick={() => select(null)}
              >
                <X />
              </button>
            </div>
            <h2>{selectedNode.topic}</h2>
            <span className="text-[9px] inline-flex items-center gap-2 text-text-secondary">
              <i
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: STATE_COLORS[states[selectedNode.id]] }}
              />
              {states[selectedNode.id]}
            </span>
            <div className="flex items-end justify-between mt-7">
              <span className="text-[10px] text-text-muted">Domínio atual</span>
              <strong className="text-3xl text-accent font-normal tracking-tighter">
                {percent(selectedNode.mastery)}
                <small className="text-xs">%</small>
              </strong>
            </div>
            <div className="atlas-progress">
              <i style={{ width: `${percent(selectedNode.mastery)}%` }} />
            </div>
            <div className="inspector-stat">
              <span>Pré-requisitos</span>
              <strong>
                {
                  selectedEdges.filter((edge) => edge.to_node === selected)
                    .length
                }
              </strong>
            </div>
            <div className="inspector-stat">
              <span>Abre caminho para</span>
              <strong>
                {
                  selectedEdges.filter((edge) => edge.from_node === selected)
                    .length
                }{" "}
                tópicos
              </strong>
            </div>
            <div className="inspector-stat">
              <span>Prática registrada</span>
              <strong>{selectedStats?.seen ?? 0} respostas</strong>
            </div>
            {!!selectedStats?.seen && (
              <div className="inspector-stat">
                <span>Taxa de acerto</span>
                <strong>
                  {percent(selectedStats.correct / selectedStats.seen)}%
                </strong>
              </div>
            )}
            <div className="inspector-stat">
              <span>Tarefas na disciplina</span>
              <strong>
                {
                  tasks.filter((task) => task.subject === selectedNode.subject)
                    .length
                }
              </strong>
            </div>
            <div className="space-y-2 mt-6">
              <Button
                fullWidth
                size="sm"
                loading={busy === "study"}
                disabled={!!busy}
                onClick={study}
              >
                <Play size={12} />
                Estudar agora <ArrowUpRight size={12} />
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!!busy}
                  loading={busy === "planner"}
                  onClick={planner}
                >
                  <CalendarPlus size={12} />
                  Planner
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!!busy}
                  loading={busy === "recall"}
                  onClick={flashcard}
                >
                  <Layers size={12} />
                  Recall
                </Button>
              </div>
              <Button
                fullWidth
                size="sm"
                variant="secondary"
                disabled={!!busy}
                loading={busy === "lia"}
                onClick={ask}
              >
                <Sparkles size={12} />
                Explorar com a LIA
              </Button>
            </div>
            {liaNote && (
              <div
                className="text-xs leading-relaxed mt-5 p-3 rounded-lg bg-bg-primary max-h-64 overflow-y-auto whitespace-pre-wrap"
                aria-live="polite"
              >
                {liaNote}
              </div>
            )}
            {selectedQuestions.length > 0 && (
              <div className="mt-6">
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-3">
                  Questões relacionadas · {selectedQuestions.length}
                </p>
                {selectedQuestions.slice(0, 3).map((question) => (
                  <p
                    key={question.id}
                    className="text-[10px] leading-relaxed text-text-secondary mb-2"
                  >
                    {question.stem.slice(0, 110)}
                    {question.stem.length > 110 ? "…" : ""}
                  </p>
                ))}
                <Link
                  className="text-[10px] text-accent inline-flex items-center gap-2 mt-2"
                  to="/questions"
                >
                  Abrir banco de questões <ArrowUpRight size={11} />
                </Link>
              </div>
            )}
            <div className="border-t border-border mt-6 pt-4">
              <button
                className="inline-flex items-center gap-2 text-[9px] text-text-muted hover:text-error"
                disabled={!!busy}
                onClick={() => deleteDialog.current?.showModal()}
              >
                <Trash2 size={11} />
                Remover conteúdo
              </button>
            </div>
          </aside>
        )}
      </div>
      {!empty && !loading && view === "graph" && (
        <details className="mt-5">
          <summary className="text-[10px] text-text-muted cursor-pointer">
            Explorar pela lista de tópicos · alternativa ao mapa
          </summary>
          <div className="atlas-topics mt-3 border border-border rounded-xl">
            {filtered.map((node) => (
              <button
                key={node.id}
                aria-pressed={selected === node.id}
                onClick={() => select(node.id)}
              >
                <span className="flex-1">
                  {node.subject} · {node.topic}
                  <small>{states[node.id]}</small>
                </span>
                <span className="font-mono text-[10px]">
                  {percent(node.mastery)}%
                </span>
              </button>
            ))}
          </div>
        </details>
      )}
      <dialog ref={createDialog} className="atlas-create">
        <form onSubmit={add}>
          <div className="flex justify-between gap-4">
            <span className="section-eyebrow">UMA NOVA CONEXÃO</span>
            <button
              type="button"
              aria-label="Fechar criação"
              onClick={() => createDialog.current?.close()}
            >
              <X size={16} />
            </button>
          </div>
          <h2 className="mt-5">Expanda seu universo.</h2>
          <p>Comece com uma disciplina e o assunto que deseja explorar.</p>
          <label htmlFor="atlas-subject">Disciplina</label>
          <Input
            id="atlas-subject"
            autoFocus
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Ex.: Física"
            required
            maxLength={160}
          />
          <label htmlFor="atlas-topic">Tópico</label>
          <Input
            id="atlas-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Ex.: Leis de Newton"
            required
            maxLength={200}
          />
          {error && (
            <p role="alert" className="!text-error mt-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-7">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => createDialog.current?.close()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={busy === "create"}
              disabled={!!busy || !subject.trim() || !topic.trim()}
            >
              <Plus size={13} />
              Adicionar ao Atlas
            </Button>
          </div>
        </form>
      </dialog>
      <dialog ref={deleteDialog} className="atlas-create">
        <span className="section-eyebrow">REMOVER CONTEÚDO</span>
        <h2 className="mt-5">Remover esta conexão?</h2>
        <p>
          O tópico “{selectedNode?.topic}” será removido do seu Atlas. Confirme
          apenas se quiser continuar.
        </p>
        {error && (
          <p role="alert" className="!text-error mt-3">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-7">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => deleteDialog.current?.close()}
          >
            Manter tópico
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!!busy}
            loading={busy === "delete"}
            onClick={remove}
          >
            Remover
          </Button>
        </div>
      </dialog>
    </div>
  );
}
