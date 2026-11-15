// /api/profiles/[id]/exams/[eid]/attempts/[aid]
// PATCH = autosalvamento de respostas (recuperável); POST = entrega (correção determinística)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../../_lib/http';
import { db } from '../../../../../_lib/db';
import { gradeExam, updateMastery } from '../../../../../_lib/academic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const examId = Array.isArray(req.query.eid) ? req.query.eid[0] : req.query.eid;
  const aid = Array.isArray(req.query.aid) ? req.query.aid[0] : req.query.aid;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');
  const attempt = await db.gGet<any>('exam_attempt', aid);
  if (!attempt || attempt.profile_id !== profileId || attempt.exam_id !== examId) return error(res, 404, 'Tentativa não encontrada', 'NOT_FOUND');

  if (req.method === 'PATCH') {
    if (attempt.status !== 'in_progress') return error(res, 409, 'Tentativa já entregue', 'CONFLICT');
    const body = await readBody(req);
    const answers = { ...(attempt.answers ?? {}), ...(body.answers ?? {}) };
    return json(res, 200, await db.gUpdate('exam_attempt', aid, { answers }));
  }

  if (req.method === 'POST') {
    if (attempt.status !== 'in_progress') return error(res, 409, 'Tentativa já entregue', 'CONFLICT');
    const body = await readBody(req);
    const finalAnswers = { ...(attempt.answers ?? {}), ...(body.answers ?? {}) };
    const exam = await db.gGet<any>('exam', examId);
    const qids: string[] = exam?.question_ids ?? [];
    const questions = (await db.listQuestions(profileId)).filter((q: any) => qids.includes(q.id));
    const graded = gradeExam(questions.map((q: any) => ({ id: q.id, correct_answer: q.correct_answer, type: q.type })), finalAnswers);
    const timeSpent = Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const updated = await db.gUpdate('exam_attempt', aid, {
      answers: finalAnswers, status: 'submitted', submitted_at: new Date().toISOString(),
      score: graded.score, max_score: graded.maxScore, time_spent_seconds: timeSpent,
    });
    // Atualiza estatísticas das questões + domínio do Atlas (integração Exams→ErrorLab→Atlas)
    for (const q of questions as any[]) {
      await db.updateQuestionStats(q.id, graded.perQuestion[q.id] === true);
      if (q.subject && q.topic) {
        const node = (await db.gList<any>('atlas_node', profileId)).find((n: any) => n.subject === q.subject && n.topic === q.topic);
        if (node) {
          await db.gUpdate('atlas_node', node.id, {
            mastery: updateMastery(node.mastery ?? 0, graded.perQuestion[q.id] === true),
            last_practiced: new Date().toISOString(),
            source_question_count: (node.source_question_count ?? 0) + 1,
          });
        }
      }
    }
    return json(res, 200, { attempt: updated, perQuestion: graded.perQuestion, score: graded.score, maxScore: graded.maxScore });
  }
  return methodNotAllowed(res);
}
