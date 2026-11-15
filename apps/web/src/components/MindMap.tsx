import { MindNode, PositionedNode, layoutMindMap, layoutSize, } from '@/utils/mindmap';

interface Props {
  root: MindNode;
  className?: string;
}

function NodeView({ node, parent }: { node: PositionedNode; parent?: PositionedNode }) {
  const cx = node.x + 80; // centro do nó (NODE_W=160)
  const cy = node.y + 20; // centro vertical (NODE_H=40)
  const pcx = parent ? parent.x + 80 : 0;
  const pcy = parent ? parent.y + 20 : 0;
  return (
    <g>
      {parent && (
        <path
          d={`M ${pcx} ${pcy} C ${pcx + 30} ${pcy}, ${cx - 30} ${cy}, ${cx - 80} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      )}
      <rect
        x={node.x}
        y={node.y}
        width={160}
        height={40}
        rx={8}
        className="fill-surface stroke-border"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text-primary"
        style={{ fontSize: 12, pointerEvents: 'none' }}
      >
        {node.label.length > 22 ? node.label.slice(0, 21) + '…' : node.label}
      </text>
      {node.children.map((c, i) => (
        <NodeView key={i} node={c} parent={node} />
      ))}
    </g>
  );
}

export function MindMap({ root, className }: Props) {
  const layout = layoutMindMap(root);
  const { width, height } = layoutSize(layout);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className ?? 'w-full text-text-primary'}
      style={{ maxWidth: '100%', height: 'auto' }}
      role="img"
      aria-label={`Mapa mental: ${root.label}`}
    >
      <NodeView node={layout} />
    </svg>
  );
}
