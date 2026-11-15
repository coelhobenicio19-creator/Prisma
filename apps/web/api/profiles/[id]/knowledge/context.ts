// /api/profiles/[id]/knowledge/context — entradas permitidas para a LIA (allow_lia=true)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, requireUser } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'GET') return error(res, 405, 'Método não permitido', 'METHOD');
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');
  const all = await db.gList<any>('knowledge_entry', profileId);
  return json(res, 200, all.filter((e: any) => e.allow_lia !== false));
}
