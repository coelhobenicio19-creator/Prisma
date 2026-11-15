// POST /api/auth/logout — limpa os cookies de sessão.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return error(res, 405, 'Método não permitido', 'METHOD_NOT_ALLOWED');
  res.setHeader('Set-Cookie', [
    'sb-access-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
    'sb-refresh-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  ]);
  return json(res, 200, { ok: true });
}
