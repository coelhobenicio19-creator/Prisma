import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Network, ArrowUpRight, X, RefreshCw } from "lucide-react";
import { useProfileStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Atlas3DGraph } from "@/components/Atlas3DGraph";
import { getDashboardData, MasteryTopic } from "@/services/tauri";
import { deriveNodeState, STATE_COLORS } from "@/utils/atlas";
import { filterAtlasNodes } from "@/utils/atlas-view";

export function NativeAtlas() {
  const profile = useProfileStore((state) => state.currentProfile);
  const [topics, setTopics] = useState<MasteryTopic[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [list, setList] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setTopics([]);
    setSelected(null);
    if (!profile) return;
    setLoading(true);
    setError("");
    getDashboardData(profile.id)
      .then((data) => {
        if (active) setTopics(data.mastery_overview);
      })
      .catch(() => {
        if (active)
          setError("Não foi possível carregar os tópicos do banco local.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile, revision]);
  const nodes = useMemo(
    () =>
      topics.map((topic) => ({
        id: topic.topic_id,
        subject: topic.subject_name,
        topic: topic.topic_name,
        mastery: topic.mastery_level,
        evidence: topic.evidence_count,
      })),
    [topics],
  );
  const visible = useMemo(
    () => filterAtlasNodes(nodes, query, subject),
    [nodes, query, subject],
  );
  const states = useMemo(
    () =>
      Object.fromEntries(
        nodes.map((node) => [
          node.id,
          deriveNodeState({
            mastery: node.mastery,
            seen: 0,
            accuracy: null,
            dueReviews: 0,
            errorCount: 0,
            prereqPending: false,
          }),
        ]),
      ),
    [nodes],
  );
  const current = visible.find((node) => node.id === selected);
  const subjects = [...new Set(nodes.map((node) => node.subject))];
  return (
    <div className="atlas-workspace animate-fade-in">
      <div className="atlas-heading">
        <div>
          <span className="section-eyebrow">CONHECIMENTO EM EXPANSÃO</span>
          <h1>Seu Atlas.</h1>
          <p>Uma nova perspectiva sobre o que você está aprendendo.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw size={12} />
          Atualizar
        </Button>
      </div>
      {error && (
        <p className="atlas-status text-error" role="alert">
          {error}
        </p>
      )}
      <div className="atlas-toolbar">
        <div className="atlas-filters">
          <div className="atlas-search">
            <Search />
            <input
              aria-label="Buscar tópico"
              placeholder="Encontre uma conexão…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="Disciplina"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="atlas-mode">
          <button aria-pressed={!list} onClick={() => setList(false)}>
            Mapa 3D
          </button>
          <button aria-pressed={list} onClick={() => setList(true)}>
            Lista de tópicos
          </button>
        </div>
      </div>
      <div className={`atlas-stage ${current ? "has-selection" : ""}`}>
        <div className="atlas-map-panel">
          {loading ? (
            <div className="atlas-empty" role="status">
              <Network className="animate-pulse" />
              <h2>Conectando seu universo…</h2>
            </div>
          ) : !visible.length ? (
            <div className="atlas-empty">
              <Network size={40} strokeWidth={1} />
              <h2>
                {nodes.length
                  ? "Nenhuma conexão encontrada."
                  : "Seu conhecimento começa aqui."}
              </h2>
              <p>
                {nodes.length
                  ? "Experimente outro termo ou outra disciplina."
                  : "Os tópicos disponíveis no seu painel local aparecem aqui. Configure seu perfil e reúna seus materiais para começar."}
              </p>
              {nodes.length ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setSubject("");
                  }}
                >
                  Limpar filtros
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to={profile ? "/library" : "/onboarding"}>
                    {profile ? "Abrir biblioteca" : "Configurar perfil"}
                    <ArrowUpRight size={12} />
                  </Link>
                </Button>
              )}
            </div>
          ) : list ? (
            <div className="atlas-topics py-4">
              {visible.map((node) => (
                <button
                  key={node.id}
                  aria-pressed={node.id === selected}
                  onClick={() => setSelected(node.id)}
                >
                  <span className="flex-1">
                    {node.topic}
                    <small>
                      {node.subject} · {states[node.id]}
                    </small>
                  </span>
                  <span className="font-mono text-xs">
                    {Math.round(node.mastery * 100)}%
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Atlas3DGraph
              nodes={visible}
              edges={[]}
              states={states}
              selectedId={selected}
              onSelect={setSelected}
            />
          )}
          <div className="atlas-legend">
            {Object.entries(STATE_COLORS).map(([state, color]) => (
              <span key={state}>
                <i style={{ background: color }} />
                {state}
              </span>
            ))}
          </div>
        </div>
        {current && (
          <aside className="atlas-inspector">
            <div className="flex justify-between">
              <span className="section-eyebrow">{current.subject}</span>
              <button
                aria-label="Fechar detalhes"
                onClick={() => setSelected(null)}
              >
                <X size={14} />
              </button>
            </div>
            <h2>{current.topic}</h2>
            <p className="text-xs text-text-muted">{states[current.id]}</p>
            <div className="inspector-stat">
              <span>Domínio atual</span>
              <strong>{Math.round(current.mastery * 100)}%</strong>
            </div>
            <div className="atlas-progress">
              <i style={{ width: `${current.mastery * 100}%` }} />
            </div>
            <div className="inspector-stat">
              <span>Evidências registradas</span>
              <strong>{current.evidence}</strong>
            </div>
            <Button asChild size="sm" fullWidth className="mt-6">
              <Link to="/learn">
                Continuar aprendendo <ArrowUpRight size={12} />
              </Link>
            </Button>
          </aside>
        )}
      </div>
      <p className="text-[10px] text-text-muted mt-4">
        Visão dos tópicos disponíveis no painel local. As conexões com a
        disciplina representam agrupamentos; pré-requisitos não são inferidos.
      </p>
    </div>
  );
}
