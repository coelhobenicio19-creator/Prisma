// /api/profiles/[id]/documents — GET lista documentos do perfil.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!profileId) return error(res, 400, 'profile id ausente', 'VALIDATION');

  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') return json(res, 200, await db.listDocuments(profileId));
  return methodNotAllowed(res);
}
