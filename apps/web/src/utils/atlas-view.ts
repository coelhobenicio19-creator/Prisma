import type { AtlasNodeInput } from './atlas';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export function filterAtlasNodes<T extends AtlasNodeInput>(nodes: T[], query: string, subject: string): T[] {
  const needle = normalize(query);
  return nodes.filter((node) => (!subject || node.subject === subject) &&
    (!needle || normalize(`${node.subject} ${node.topic}`).includes(needle)));
}

export function visibleAtlasEdges<T extends { from_node: string; to_node: string }>(edges: T[], nodes: { id: string }[]): T[] {
  const ids = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => ids.has(edge.from_node) && ids.has(edge.to_node));
}

export function clampAtlasZoom(value: number): number {
  return Number.isFinite(value) ? Math.min(1.8, Math.max(0.55, value)) : 1;
}
