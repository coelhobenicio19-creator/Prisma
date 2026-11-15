// /api/profiles/[id]/flashcards/review — POST registra revisão (FSRS)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.card_id || typeof body.rating !== 'number') return error(res, 400, 'card_id e rating (1-4) obrigatórios', 'VALIDATION');
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 4) return error(res, 400, 'Avaliação deve estar entre 1 e 4', 'VALIDATION');
    const card = await db.gGet<{ profile_id: string }>('flashcard', String(body.card_id));
    if (!card || card.profile_id !== profileId) return error(res, 404, 'Flashcard não encontrado', 'NOT_FOUND');
    // Chama RPC fsrs_update no Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    if (!SUPABASE_URL) return error(res, 500, 'Supabase não configurado', 'CONFIG');
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fsrs_update`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ p_card_id: body.card_id, p_rating: body.rating }),
    });
    if (!r.ok) return error(res, 502, 'Falha no FSRS', 'FSRS_ERROR');
    const data = await r.json();
    return json(res, 200, data);
  }
  return methodNotAllowed(res);
}
