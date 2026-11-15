// /api/profiles/[id]/goals — GET lista, POST cria
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') return json(res, 200, await db.listGoals(profileId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.title || !body.target_type || !body.target_value || !body.period_start || !body.period_end) return error(res, 400, 'title, target_type, target_value, period_start, period_end obrigatórios', 'VALIDATION');
    const g = await db.createGoal({ profile_id: profileId, title: String(body.title), description: body.description ?? null, target_type: String(body.target_type), target_value: Number(body.target_value), period_start: String(body.period_start), period_end: String(body.period_end) });
    return json(res, 201, g);
  }
  return methodNotAllowed(res);
}