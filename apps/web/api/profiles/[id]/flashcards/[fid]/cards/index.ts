// /api/profiles/[id]/flashcards/[fid]/cards — GET lista cards, POST cria card
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../../_lib/http';
import { db } from '../../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const deckId = Array.isArray(req.query.fid) ? req.query.fid[0] : req.query.fid;
  const deck = await db.getDeck(deckId);
  if (!deck || deck.profile_id !== profileId) return error(res, 404, 'Deck não encontrado', 'NOT_FOUND');

  if (req.method === 'GET') return json(res, 200, await db.listFlashcards(deckId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.front || !body.back) return error(res, 400, 'front e back são obrigatórios', 'VALIDATION');
    const card = await db.createFlashcard({
      deck_id: deckId, profile_id: profileId,
      type: body.type ?? 'basic', front: String(body.front), back: String(body.back),
      extra_data: body.extra_data ?? null, tags: body.tags ?? [],
      source_type: body.source_type ?? 'manual', source_id: body.source_id ?? null,
      difficulty: body.difficulty ?? 0.5, stability: 0, retrievability: 0, reps: 0, lapses: 0,
    });
    return json(res, 201, card);
  }
  return methodNotAllowed(res);
}