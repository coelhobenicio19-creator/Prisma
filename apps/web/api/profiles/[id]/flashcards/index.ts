// /api/profiles/[id]/flashcards — GET lista decks, POST cria deck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'GET') return json(res, 200, await db.listDecks(profileId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.name) return error(res, 400, 'name é obrigatório', 'VALIDATION');
    const deck = await db.createDeck({ profile_id: profileId, name: String(body.name), description: body.description ?? null, algorithm: body.algorithm ?? 'fsrs', fsrs_params: body.fsrs_params ?? null });
    return json(res, 201, deck);
  }
  return methodNotAllowed(res);
}