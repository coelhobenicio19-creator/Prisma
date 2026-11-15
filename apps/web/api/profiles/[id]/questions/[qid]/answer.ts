// /api/profiles/[id]/questions/[qid]/answer — POST registra acerto/erro (atualiza estatísticas)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../_lib/http';
import { db } from '../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const questionId = Array.isArray(req.query.qid) ? req.query.qid[0] : req.query.qid;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'POST') {
    const body = await readBody(req);
    if (typeof body.correct !== 'boolean') return error(res, 400, 'correct (boolean) obrigatório', 'VALIDATION');
    const q = await db.getQuestion(questionId);
    if (!q || q.profile_id !== profileId) return error(res, 404, 'Questão não encontrada', 'NOT_FOUND');
    await db.updateQuestionStats(questionId, body.correct);
    const after = await db.getQuestion(questionId);
    return json(res, 200, { times_seen: after?.times_seen ?? 0, times_correct: after?.times_correct ?? 0 });
  }
  return methodNotAllowed(res);
}
