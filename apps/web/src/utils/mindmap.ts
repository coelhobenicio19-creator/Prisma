// ============================================================
// MindMap — renderizador SVG leve de árvore (sem dependências)
// layoutMindMap calcula posições puras (testável em node).
// ============================================================

export interface MindNode {
  label: string;
  children?: MindNode[];
}

export interface PositionedNode {
  label: string;
  x: number;
  y: number;
  depth: number;
  children: PositionedNode[];
}

const NODE_W = 160;
const NODE_H = 40;
const H_GAP = 60;
const V_GAP = 14;

/** Conta folhas de um nó (para espaçamento vertical). */
function countLeaves(n: MindNode): number {
  if (!n.children || n.children.length === 0) return 1;
  return n.children.reduce((acc, c) => acc + countLeaves(c), 0);
}

/** Calcula layout: x = profundidade, y = posição acumulada entre folhas. */
export function layoutMindMap(root: MindNode): PositionedNode {
  function place(node: MindNode, depth: number, yStart: number): PositionedNode {
    const leaves = countLeaves(node);
    const h = leaves * (NODE_H + V_GAP);
    const y = yStart + h / 2 - NODE_H / 2;
    const x = depth * (NODE_W + H_GAP);
    const children: PositionedNode[] = [];
    let cy = yStart;
    for (const c of node.children ?? []) {
      children.push(place(c, depth + 1, cy));
      cy += countLeaves(c) * (NODE_H + V_GAP);
    }
    return { label: node.label, x, y, depth, children };
  }

  return place(root, 0, 0);
}

/** Largura/altura totais do layout (para o viewBox do SVG). */
export function layoutSize(root: PositionedNode): { width: number; height: number } {
  let maxX = 0, maxY = 0;
  (function walk(n: PositionedNode) {
    maxX = Math.max(maxX, n.x + NODE_W);
    maxY = Math.max(maxY, n.y + NODE_H);
    n.children.forEach(walk);
  })(root);
  return { width: maxX, height: maxY };
}
