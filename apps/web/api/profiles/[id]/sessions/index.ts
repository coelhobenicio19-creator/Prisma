// /api/profiles/[id]/sessions — GET lista, POST cria
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    return json(res, 200, await db.listSessions(profileId, from, to));
  }
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.type || !body.planned_duration) return error(res, 400, 'type e planned_duration obrigatórios', 'VALIDATION');
    const s = await db.createSession({
      profile_id: profileId, type: String(body.type), status: body.status ?? 'planned',
      planned_duration: /^\d+(\.\d+)?$/.test(String(body.planned_duration)) ? `${body.planned_duration} minutes` : String(body.planned_duration),
      actual_duration: body.actual_duration == null ? null : /^\d+(\.\d+)?$/.test(String(body.actual_duration)) ? `${body.actual_duration} minutes` : String(body.actual_duration),
      started_at: body.started_at ?? null, ended_at: body.ended_at ?? null,
      deck_id: body.deck_id ?? null, document_id: body.document_id ?? null, notes: body.notes ?? null,
    });
    return json(res, 201, s);
  }
  return methodNotAllowed(res);
}
