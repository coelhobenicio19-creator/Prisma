// /api/profiles/[id]/commitments — GET lista, POST cria
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
    return json(res, 200, await db.listCommitments(profileId, from, to));
  }
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.title || !body.type || !body.start_at || !body.end_at) return error(res, 400, 'title, type, start_at, end_at obrigatórios', 'VALIDATION');
    const c = await db.createCommitment({
      profile_id: profileId, title: String(body.title), description: body.description ?? null,
      type: String(body.type), start_at: String(body.start_at), end_at: String(body.end_at),
      all_day: body.all_day ?? false, location: body.location ?? null,
      recurrence_rule: body.recurrence_rule ?? null, source_type: body.source_type ?? null, source_id: body.source_id ?? null,
    });
    return json(res, 201, c);
  }
  return methodNotAllowed(res);
}