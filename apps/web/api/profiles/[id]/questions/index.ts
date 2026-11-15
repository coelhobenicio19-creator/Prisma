// /api/profiles/[id]/questions — GET lista, POST cria
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
    const subject = req.query.subject as string | undefined;
    const topic = req.query.topic as string | undefined;
    return json(res, 200, await db.listQuestions(profileId, subject, topic));
  }
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.stem || !body.type) return error(res, 400, 'stem e type obrigatórios', 'VALIDATION');
    const q = await db.createQuestion({
      profile_id: profileId, stem: String(body.stem), type: String(body.type),
      alternatives: body.alternatives ?? null, correct_answer: body.correct_answer ?? null,
      explanation: body.explanation ?? null, subject: body.subject ?? null, topic: body.topic ?? null,
      difficulty: body.difficulty ?? null, source_type: body.source_type ?? null, source_id: body.source_id ?? null,
      tags: body.tags ?? [],
    });
    return json(res, 201, q);
  }
  return methodNotAllowed(res);
}