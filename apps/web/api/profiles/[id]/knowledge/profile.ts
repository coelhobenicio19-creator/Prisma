// /api/profiles/[id]/knowledge/profile — GET/PUT perfil único por profile
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
    const rows = await db.gQuery<any>('knowledge_profile', `profile_id=eq.${profileId}`);
    return json(res, 200, rows[0] ?? null);
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    const body = await readBody(req);
    const existing = (await db.gQuery<any>('knowledge_profile', `profile_id=eq.${profileId}`))[0];
    if (existing) {
      delete (body as any).id; delete (body as any).profile_id;
      return json(res, 200, await db.gUpdate('knowledge_profile', existing.id, body));
    }
    return json(res, 201, await db.gInsert('knowledge_profile', { ...body, profile_id: profileId }));
  }
  if (req.method === 'DELETE') {
    const existing = (await db.gQuery<any>('knowledge_profile', `profile_id=eq.${profileId}`))[0];
    if (existing) await db.gDelete('knowledge_profile', existing.id);
    await db.gDelete('knowledge_entry', ''); // noop seguro p/ mock; no supabase usa query abaixo
    return json(res, 204, null);
  }
  return methodNotAllowed(res);
}
