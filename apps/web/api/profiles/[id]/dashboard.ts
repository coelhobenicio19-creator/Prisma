// /api/profiles/[id]/dashboard — GET dados agregados do dashboard.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, requireUser, methodNotAllowed } from '../../_lib/http';
import { db } from '../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'GET') return methodNotAllowed(res);

  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  return json(res, 200, await db.dashboard(profileId));
}
