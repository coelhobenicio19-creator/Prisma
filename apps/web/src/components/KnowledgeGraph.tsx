// Grafo de conhecimento visual (SVG puro, sem lib pesada).
// Núcleos = disciplinas (nós grandes), tópicos = nós menores ao redor.
// Cores por estado de aprendizado, glow no hover/seleção, arestas animadas p/ nós ativos.
import { STATE_COLORS, GraphNode, NodeState } from '@/utils/atlas';

interface Props {
  nodes: GraphNode[];
  edges: Array<{ from_node: string; to_node: string }>;
  states: Record<string, NodeState>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  width?: number;
  height?: number;
}

export function KnowledgeGraph({ nodes, edges, states, selectedId, onSelect, width = 920, height = 560 }: Props) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nodeKey = (n: GraphNode) => (n.isSubject ? `subject:${n.subject}` : n.id);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto select-none"
      style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.35))' }}
      onClick={() => onSelect(null)}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* arestas */}
      {edges.map((e, i) => {
        const a = byId.get(nodeKey(nodes.find((n) => n.id === e.from_node || nodeKey(n) === e.from_node) as GraphNode) ?? '') ?? byId.get(e.from_node);
        const b = byId.get(e.to_node);
        if (!a || !b) return null;
        const active = selectedId === e.from_node || selectedId === e.to_node;
        return (
          <line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={active ? 'url(#edgeGrad)' : '#475569'}
            strokeWidth={active ? 2.5 : 1.2}
            strokeOpacity={active ? 0.9 : 0.35}
            strokeDasharray={active ? '6 4' : undefined}
            className={active ? 'animate-pulse' : ''}
          />
        );
      })}

      {/* nós */}
      {nodes.map((n) => {
        const key = nodeKey(n);
        const state = n.isSubject ? null : states[n.id];
        const color = state ? STATE_COLORS[state] : '#6366f1';
        const sel = selectedId === key;
        return (
          <g key={key} transform={`translate(${n.x},${n.y})`}
             className="cursor-pointer transition-all duration-300"
             style={{ transformOrigin: `${n.x}px ${n.y}px` }}
             onClick={(e) => { e.stopPropagation(); onSelect(sel ? null : key); }}>
            {sel && <circle r={n.r + 14} fill="url(#glow)" className="animate-pulse" />}
            <circle
              r={sel ? n.r + 4 : n.r}
              fill={n.isSubject ? '#1e293b' : '#0f172a'}
              stroke={color}
              strokeWidth={sel ? 3 : n.isSubject ? 2.5 : 1.5}
              className="transition-all duration-300 hover:stroke-[4px]"
            />
            <text
              textAnchor="middle" dominantBaseline="central"
              fill={n.isSubject ? '#e2e8f0' : color}
              fontSize={n.isSubject ? 11 : 9}
              fontWeight={n.isSubject ? 700 : 500}
              className="pointer-events-none"
            >
              {n.topic.length > (n.isSubject ? 14 : 12) ? n.topic.slice(0, n.isSubject ? 13 : 11) + '…' : n.topic}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
