// /api/profiles/[id]/school/subjects/[sid]/grades — GET notas da disciplina; POST registra nota
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../../_lib/http';
import { db } from '../../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const sid = Array.isArray(req.query.sid) ? req.query.sid[0] : req.query.sid;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');
  const subject = await db.gGet<any>('school_subject', sid);
  if (!subject || subject.profile_id !== profileId) return error(res, 404, 'Disciplina não encontrada', 'NOT_FOUND');

  if (req.method === 'GET') {
    const all = await db.gList<any>('school_grade', profileId);
    return json(res, 200, all.filter((g) => g.subject_id === sid));
  }
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (typeof body.value !== 'number' || !body.label) return error(res, 400, 'label e value (number) obrigatórios', 'VALIDATION');
    if (body.value < 0 || (body.max_value ?? 10) <= 0) return error(res, 400, 'Notas inválidas', 'VALIDATION');
    const g = await db.gInsert('school_grade', {
      profile_id: profileId, subject_id: sid, label: String(body.label),
      value: body.value, max_value: body.max_value ?? 10, weight: body.weight ?? 1, date: body.date ?? null,
    });
    return json(res, 201, g);
  }
  return methodNotAllowed(res);
}
