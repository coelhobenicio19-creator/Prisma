// /api/profiles/[id]/search — POST { query, limit } busca full-text.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return methodNotAllowed(res);

  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  const body = await readBody(req);
  if (!body.query) return error(res, 400, 'query é obrigatório', 'VALIDATION');
  return json(res, 200, await db.search(profileId, String(body.query), Number(body.limit ?? 20)));
}
