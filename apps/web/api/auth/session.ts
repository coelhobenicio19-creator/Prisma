// GET /api/auth/session — devolve o usuário da sessão atual (ou 401).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, requireUser } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return error(res, 405, 'Método não permitido', 'METHOD_NOT_ALLOWED');
  const user = await requireUser(req, res);
  if (!user) return;
  return json(res, 200, user);
}
