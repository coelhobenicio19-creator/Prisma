// /api/profiles/[id]/school/grades — GET todas as notas do perfil
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, requireUser } from '../../../../_lib/http';
import { db } from '../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'GET') return json(res, 405, { error: { message: 'Método não permitido' } });
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return json(res, 403, { error: { message: 'Acesso negado' } });
  return json(res, 200, await db.gList<any>('school_grade', profileId));
}
