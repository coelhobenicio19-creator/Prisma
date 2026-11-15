// /api/profiles/[id]/atlas/edges — GET lista; POST cria aresta com validação anti-ciclo
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../_lib/http';
import { db } from '../../../../_lib/db';
import { hasCycle } from '../../../../_lib/academic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') return json(res, 200, await db.gList<any>('atlas_edge', profileId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    const from = String(body.from_node ?? ''); const to = String(body.to_node ?? '');
    if (!from || !to) return error(res, 400, 'from_node e to_node obrigatórios', 'VALIDATION');
    if (from === to) return error(res, 400, 'Aresta para o próprio nó não é permitida', 'VALIDATION');
    const nFrom = await db.gGet<any>('atlas_node', from);
    const nTo = await db.gGet<any>('atlas_node', to);
    if (!nFrom || !nTo || nFrom.profile_id !== profileId || nTo.profile_id !== profileId)
      return error(res, 404, 'Nós não encontrados neste perfil', 'NOT_FOUND');
    const edges = await db.gList<any>('atlas_edge', profileId);
    if (hasCycle(edges.map((e) => ({ from: e.from_node, to: e.to_node })), { from, to }))
      return error(res, 409, 'Aresta criaria ciclo de pré-requisitos', 'CYCLE');
    const edge = await db.gInsert('atlas_edge', { profile_id: profileId, from_node: from, to_node: to, kind: body.kind ?? 'prerequisite' });
    return json(res, 201, edge);
  }
  return methodNotAllowed(res);
}
