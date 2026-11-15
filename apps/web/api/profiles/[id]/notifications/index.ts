// /api/profiles/[id]/notifications — GET lista, POST cria
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
    const unread = req.query.unread === 'true';
    return json(res, 200, await db.listNotifications(profileId, unread));
  }
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.type || !body.title || !body.scheduled_for) return error(res, 400, 'type, title, scheduled_for obrigatórios', 'VALIDATION');
    const n = await db.createNotification({ profile_id: profileId, type: String(body.type), title: String(body.title), body: body.body ?? null, channel: body.channel ?? 'in_app', payload: body.payload ?? null, scheduled_for: String(body.scheduled_for) });
    return json(res, 201, n);
  }
  return methodNotAllowed(res);
}