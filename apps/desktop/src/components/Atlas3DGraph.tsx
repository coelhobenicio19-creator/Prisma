import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Pause, Play, Minus, Plus, Scan, Move } from "lucide-react";
import {
  STATE_COLORS,
  NodeState,
  layout3D,
  rotate3D,
  project,
} from "@/utils/atlas";
import { clampAtlasZoom } from "@/utils/atlas-view";
import "@/styles/atlas.css";

interface Props {
  nodes: Array<{ id: string; subject: string; topic: string }>;
  edges: Array<{ from_node: string; to_node: string }>;
  states: Record<string, NodeState>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  width?: number;
  height?: number;
}

export function Atlas3DGraph({
  nodes,
  edges,
  states,
  selectedId,
  onSelect,
  width = 1000,
  height: requestedHeight = 600,
}: Props) {
  const [ry, setRy] = useState(0.35);
  const [rx, setRx] = useState(-0.2);
  const [zoom, setZoom] = useState(1);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(width);
  const height =
    measured < 600 ? Math.min(requestedHeight, 460) : requestedHeight;
  const uid = useId().replace(/:/g, "");
  const nodes3d = useMemo(
    () => layout3D(nodes, Math.min(205, measured * 0.32)),
    [nodes, measured],
  );

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setMeasured(entry.contentRect.width),
    );
    observer.observe(element);
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((value) => clampAtlasZoom(value - event.deltaY * 0.001));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (media.matches) setPaused(true);
    };
    media.addEventListener("change", stop);
    return () => media.removeEventListener("change", stop);
  }, []);
  useEffect(() => {
    if (paused || selectedId || hovered) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !drag.current) setRy((angle) => angle + 0.002);
    }, 50);
    return () => clearInterval(timer);
  }, [paused, selectedId, hovered]);

  const projected = useMemo(
    () =>
      nodes3d
        .map((node) => {
          const rotated = rotate3D(node, ry, rx);
          return {
            ...node,
            ...project(rotated, measured / 2, height / 2 - 15, 1100, zoom),
          };
        })
        .sort((a, b) => a.z - b.z),
    [nodes3d, ry, rx, measured, height, zoom],
  );
  const byId = useMemo(
    () => new Map(projected.map((node) => [node.id, node])),
    [projected],
  );
  const related = useMemo(
    () =>
      new Set(
        edges.flatMap((edge) =>
          edge.from_node === selectedId
            ? [edge.to_node]
            : edge.to_node === selectedId
              ? [edge.from_node]
              : [],
        ),
      ),
    [edges, selectedId],
  );
  const selectedSubject = nodes.find((node) => node.id === selectedId)?.subject;
  const adjustZoom = (amount: number) =>
    setZoom((value) => clampAtlasZoom(value + amount));

  return (
    <div ref={root} className="atlas-graph" style={{ height }}>
      <div className="graph-coordinate" aria-hidden="true">
        <span>ATLAS / ESPAÇO DE CONHECIMENTO</span>
        <span>{nodes.length.toString().padStart(2, "0")} TÓPICOS</span>
      </div>
      <svg
        viewBox={`0 0 ${measured} ${height}`}
        className="graph-svg"
        aria-label="Mapa tridimensional do conhecimento. Use os controles e a lista de tópicos para explorar."
        onPointerDown={(event) => {
          if ((event.target as Element).closest("[data-node]")) return;
          drag.current = { x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x,
            dy = event.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true;
          drag.current.x = event.clientX;
          drag.current.y = event.clientY;
          setRy((angle) => angle + dx * 0.006);
          setRx((angle) => Math.max(-1.1, Math.min(1.1, angle + dy * 0.006)));
        }}
        onPointerUp={() => {
          if (drag.current && !drag.current.moved) onSelect(null);
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <radialGradient id={`${uid}-sphere`} cx="30%" cy="22%">
            <stop stopColor="#e9f4e9" />
            <stop offset=".3" stopColor="#8eafa2" />
            <stop offset=".8" stopColor="#324d45" />
            <stop offset="1" stopColor="#1a2926" />
          </radialGradient>
          <radialGradient id={`${uid}-halo`}>
            <stop stopColor="#adcdbb" stopOpacity=".1" />
            <stop offset="1" stopColor="#adcdbb" stopOpacity="0" />
          </radialGradient>
          <pattern
            id={`${uid}-grid`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".6" fill="currentColor" opacity=".15" />
          </pattern>
        </defs>
        <rect width={measured} height={height} fill={`url(#${uid}-grid)`} />
        <ellipse
          cx={measured / 2}
          cy={height / 2}
          rx={Math.min(measured * 0.46, 370)}
          ry={240}
          fill={`url(#${uid}-halo)`}
        />
        {[0, 1, 2].map((orbit) => (
          <ellipse
            key={orbit}
            cx={measured / 2}
            cy={height / 2 - 15}
            rx={Math.min(measured * 0.39, 310)}
            ry={80 + orbit * 26}
            transform={`rotate(${-28 + orbit * 37},${measured / 2},${height / 2 - 15})`}
            fill="none"
            stroke="currentColor"
            strokeOpacity=".07"
            strokeDasharray={orbit === 1 ? "2 8" : undefined}
          />
        ))}
        {projected
          .filter((node) => !node.isSubject)
          .map((node) => {
            const hub = byId.get(`subject:${node.subject}`);
            if (!hub) return null;
            const active = node.id === selectedId;
            return (
              <line
                key={`hub-${node.id}`}
                x1={hub.x}
                y1={hub.y}
                x2={node.x}
                y2={node.y}
                stroke="currentColor"
                strokeOpacity={active ? 0.7 : selectedId ? 0.08 : 0.18}
                strokeWidth={active ? 1.1 : 0.6}
              />
            );
          })}
        {edges.map((edge, index) => {
          const a = byId.get(edge.from_node),
            b = byId.get(edge.to_node);
          if (!a || !b) return null;
          const active =
            edge.from_node === selectedId || edge.to_node === selectedId;
          return (
            <path
              key={`${edge.from_node}-${edge.to_node}-${index}`}
              d={`M${a.x},${a.y} Q${(a.x + b.x) / 2 + 20},${(a.y + b.y) / 2 - 25} ${b.x},${b.y}`}
              fill="none"
              stroke={active ? "var(--color-accent)" : "currentColor"}
              strokeOpacity={active ? 0.9 : 0.24}
              strokeWidth={active ? 1.5 : 0.8}
              strokeDasharray={active ? "4 5" : undefined}
            />
          );
        })}
        {projected.map((node) => {
          const selected = selectedId === node.id;
          const active = selected || hovered === node.id;
          const connected =
            related.has(node.id) ||
            (node.isSubject && node.subject === selectedSubject);
          const dimmed = selectedId && !active && !connected;
          const scale = Math.max(0.65, Math.min(1.3, node.scale));
          const radius =
            (node.isSubject
              ? measured < 600
                ? 17
                : 24
              : measured < 600
                ? 5
                : 6) *
            scale *
            (active ? 1.3 : 1);
          const color = node.isSubject
            ? "var(--color-accent)"
            : STATE_COLORS[states[node.id] ?? "não iniciado"];
          return (
            <g
              key={node.id}
              data-node={node.id}
              className="graph-node"
              opacity={dimmed ? 0.3 : 1}
              role={node.isSubject ? undefined : "button"}
              tabIndex={node.isSubject ? undefined : 0}
              aria-label={
                node.isSubject
                  ? undefined
                  : `${node.subject}: ${node.topic}, ${states[node.id] ?? "não iniciado"}`
              }
              aria-pressed={node.isSubject ? undefined : selected}
              onPointerEnter={() => setHovered(node.id)}
              onPointerLeave={() => setHovered(null)}
              onClick={(event) => {
                event.stopPropagation();
                if (!node.isSubject) onSelect(selected ? null : node.id);
              }}
              onKeyDown={(event) => {
                if (
                  !node.isSubject &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  onSelect(selected ? null : node.id);
                }
              }}
            >
              <title>
                {node.subject} · {node.topic}
                {!node.isSubject ? ` — ${states[node.id]}` : ""}
              </title>
              <circle
                cx={node.x}
                cy={node.y}
                r={Math.max(16, radius + 9)}
                fill="transparent"
              />
              {(active || node.isSubject) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 12}
                  fill={color}
                  opacity={active ? 0.08 : 0.035}
                />
              )}
              {selected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 7}
                  fill="none"
                  stroke={color}
                  strokeWidth=".7"
                  strokeDasharray="2 3"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={
                  node.isSubject
                    ? `url(#${uid}-sphere)`
                    : "var(--color-bg-secondary)"
                }
                stroke={color}
                strokeWidth={node.isSubject ? 0.7 : 1.5}
              />
              {!node.isSubject && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius * 0.42}
                  fill={color}
                  opacity=".8"
                />
              )}
              {(node.isSubject || active || measured > 600) && (
                <text
                  x={node.x}
                  y={node.y + radius + (node.isSubject ? 21 : 16)}
                  textAnchor="middle"
                  fill={
                    active || node.isSubject
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)"
                  }
                  fontSize={node.isSubject ? 11 : 9}
                  fontWeight={node.isSubject ? 500 : 400}
                  style={{
                    paintOrder: "stroke",
                    stroke: "var(--color-bg-primary)",
                    strokeWidth: 4,
                    strokeLinejoin: "round",
                  }}
                >
                  {(node.isSubject ? node.subject : node.topic).length > 25
                    ? `${(node.isSubject ? node.subject : node.topic).slice(0, 23)}…`
                    : node.isSubject
                      ? node.subject
                      : node.topic}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="graph-bottom">
        <span className="graph-hint">
          <Move size={11} /> Arraste para explorar
        </span>
        <div className="graph-controls" aria-label="Controles do mapa">
          <button
            onClick={() => adjustZoom(-0.15)}
            aria-label="Diminuir zoom"
            disabled={zoom <= 0.55}
          >
            <Minus />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => adjustZoom(0.15)}
            aria-label="Aumentar zoom"
            disabled={zoom >= 1.8}
          >
            <Plus />
          </button>
          <i />
          <button
            onClick={() => {
              setZoom(1);
              setRx(-0.2);
              setRy(0.35);
            }}
            aria-label="Reenquadrar mapa"
          >
            <Scan />
          </button>
          <button
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? "Ativar rotação" : "Pausar rotação"}
            aria-pressed={!paused}
          >
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
      </div>
    </div>
  );
}
