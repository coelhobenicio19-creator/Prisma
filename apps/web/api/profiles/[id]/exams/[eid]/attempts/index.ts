// /api/profiles/[id]/exams/[eid]/attempts — GET lista tentativas; POST inicia nova (sem gabarito!)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../../_lib/http';
import { db } from '../../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const examId = Array.isArray(req.query.eid) ? req.query.eid[0] : req.query.eid;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');
  const exam = await db.gGet<any>('exam', examId);
  if (!exam || exam.profile_id !== profileId) return error(res, 404, 'Prova não encontrada', 'NOT_FOUND');

  if (req.method === 'GET') {
    const all = await db.gList<any>('exam_attempt', profileId);
    return json(res, 200, all.filter((a) => a.exam_id === examId));
  }
  if (req.method === 'POST') {
    await readBody(req);
    // Cria tentativa sem devolver o gabarito — só question_ids e enunciado vem do GET da prova pública
    const attempt = await db.gInsert('exam_attempt', {
      exam_id: examId, profile_id: profileId, status: 'in_progress',
      answers: {}, started_at: new Date().toISOString(),
    });
    return json(res, 201, attempt);
  }
  return methodNotAllowed(res);
}
