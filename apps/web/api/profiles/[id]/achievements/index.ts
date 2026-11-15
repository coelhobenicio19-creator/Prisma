// /api/profiles/[id]/achievements — GET lista, POST desbloqueia (idempotente)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') return json(res, 200, await db.listAchievements(profileId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.code || !body.name) return error(res, 400, 'code e name obrigatórios', 'VALIDATION');
    const a = await db.unlockAchievement(profileId, { code: String(body.code), name: String(body.name), description: body.description ?? null, icon: body.icon ?? null, tier: body.tier ?? null });
    return json(res, 200, a);
  }
  return methodNotAllowed(res);
}
