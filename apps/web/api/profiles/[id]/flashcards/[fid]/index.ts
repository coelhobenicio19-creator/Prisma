// /api/profiles/[id]/flashcards/[fid] — GET/PATCH/DELETE deck específico
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../_lib/http';
import { db } from '../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const deckId = Array.isArray(req.query.fid) ? req.query.fid[0] : req.query.fid;
  const deck = await db.getDeck(deckId);
  if (!deck || deck.profile_id !== profileId) return error(res, 404, 'Deck não encontrado', 'NOT_FOUND');

  if (req.method === 'GET') return json(res, 200, deck);
  if (req.method === 'PATCH') {
    const updates = await readBody(req);
    delete updates.id; delete updates.profile_id; delete updates.created_at;
    return json(res, 200, await db.updateDeck(deckId, updates));
  }
  if (req.method === 'DELETE') {
    await db.deleteDeck(deckId);
    return json(res, 204, null);
  }
  return methodNotAllowed(res);
}