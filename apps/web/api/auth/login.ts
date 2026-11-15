// POST /api/auth/login — autentica no Supabase Auth (e-mail+senha) e devolve sessão.
// Em modo mock (USE_MOCK_DB=1), aceita qualquer e-mail/senha e cria sessão mock.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody } from '../_lib/http';
import { isAllowedAccount, isLocalMock, normalizeAccountEmail } from '../_lib/private-access';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return error(res, 405, 'Método não permitido', 'METHOD_NOT_ALLOWED');
  const body = await readBody(req);
  const email = normalizeAccountEmail(body.email);
  const password = body.password;
  if (!email || typeof password !== 'string' || !password) return error(res, 400, 'E-mail e senha são obrigatórios', 'VALIDATION');
  if (!isAllowedAccount(email)) return error(res, 401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');

  const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
  const USE_MOCK = isLocalMock();

  if (USE_MOCK) {
    const user = { id: '00000000-0000-0000-0000-000000000001', email };
    const token = `mock:${user.id}:${email}`;
    res.setHeader('Set-Cookie', `sb-access-token=${token}; HttpOnly; Path=/; SameSite=Lax`);
    return json(res, 200, user);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return error(res, 503, 'O acesso ainda não foi configurado no servidor.', 'AUTH_NOT_CONFIGURED');

  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return error(res, 401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
  const tokens = await r.json();
  if (!tokens.access_token || !tokens.refresh_token || !isAllowedAccount(tokens.user?.email)) return error(res, 401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
  res.setHeader('Set-Cookie', [
    `sb-access-token=${tokens.access_token}; HttpOnly; Path=/; SameSite=Lax; Secure`,
    `sb-refresh-token=${tokens.refresh_token}; HttpOnly; Path=/; SameSite=Lax; Secure`,
  ]);
  return json(res, 200, { id: tokens.user.id, email: tokens.user.email });
}
