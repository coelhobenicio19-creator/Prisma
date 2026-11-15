import { describe, expect, it } from 'vitest';
import { filterAtlasNodes, visibleAtlasEdges, clampAtlasZoom } from '../src/utils/atlas-view';
import { layout3D } from '../src/utils/atlas';

const nodes = [
  { id: '1', subject: 'Física', topic: 'Óptica geométrica' },
  { id: '2', subject: 'Matemática', topic: 'Funções' },
  { id: '3', subject: 'Física', topic: 'Ondas' },
];

describe('exploração do Atlas', () => {
  it('centraliza uma disciplina isolada para manter seus tópicos visíveis', () => {
    const hub = layout3D([nodes[0]], 180).find((node) => node.isSubject)!;
    expect({ x: hub.x, y: hub.y, z: hub.z }).toEqual({ x: 0, y: 0, z: 0 });
  });
  it('encontra tópicos sem exigir acentos e ignora espaços externos', () => {
    expect(filterAtlasNodes(nodes, '  optica ', '')).toEqual([nodes[0]]);
  });
  it('combina busca e disciplina sem alterar os dados originais', () => {
    expect(filterAtlasNodes(nodes, 'fisica', 'Física')).toEqual([nodes[0], nodes[2]]);
    expect(filterAtlasNodes(nodes, 'funcoes', 'Física')).toEqual([]);
    expect(nodes).toHaveLength(3);
  });
  it('retorna todos os tópicos quando não há filtros', () => {
    expect(filterAtlasNodes(nodes, '', '')).toEqual(nodes);
  });
  it('não deixa relações órfãs quando um tópico é filtrado', () => {
    const edges = [{ from_node: '1', to_node: '2' }, { from_node: '1', to_node: '3' }];
    expect(visibleAtlasEdges(edges, [nodes[0], nodes[2]])).toEqual([edges[1]]);
  });
  it('limita zoom para manter o mapa navegável e rejeita valores inválidos', () => {
    expect(clampAtlasZoom(20)).toBe(1.8);
    expect(clampAtlasZoom(-1)).toBe(0.55);
    expect(clampAtlasZoom(1.2)).toBe(1.2);
    expect(clampAtlasZoom(Number.NaN)).toBe(1);
  });
});
