// /api/profiles e /api/profiles/[id] — CRUD de perfis de estudo (protegido por auth).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../_lib/http';
import { db } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  if (!id) {
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

  const existing = await db.getProfile(id);
  if (!existing) return error(res, 404, 'Perfil não encontrado', 'NOT_FOUND');
  if (existing.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN'); // RLS no banco reforça isso

  if (req.method === 'GET') return json(res, 200, existing);
  if (req.method === 'PATCH') {
    const updates = await readBody(req);
    delete updates.id; delete updates.user_id; delete updates.created_at;
    return json(res, 200, await db.updateProfile(id, updates));
  }
  if (req.method === 'DELETE') {
    await db.deleteProfile(id);
    return json(res, 204, null);
  }
  return methodNotAllowed(res);
}
