// /api/profiles/index — GET lista, POST cria (merge com [id].ts do Vercel: sem id = colección).
// Vercel roteia /api/profiles para cá quando não há [id].
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../_lib/http';
import { db } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') return json(res, 200, await db.listProfiles(user.id));
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.name || !body.goal_type) return error(res, 400, 'name e goal_type são obrigatórios', 'VALIDATION');
    const profile = await db.createProfile({
      user_id: user.id,
      name: String(body.name),
      goal_type: String(body.goal_type),
      goal_description: body.goal_description ?? null,
      target_exam_id: body.target_exam_id ?? null,
      institution_id: body.institution_id ?? null,
      timezone: body.timezone ?? 'America/Sao_Paulo',
    });
    return json(res, 201, profile);
  }
  return methodNotAllowed(res);
}
