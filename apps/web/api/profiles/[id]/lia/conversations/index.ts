// /api/profiles/[id]/lia/conversations — GET lista, POST cria
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../_lib/http';
import { db } from '../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') return json(res, 200, await db.listConversations(profileId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    const c = await db.createConversation({ profile_id: profileId, title: body.title ?? null, model: body.model ?? null });
    return json(res, 201, c);
  }
  return methodNotAllowed(res);
}