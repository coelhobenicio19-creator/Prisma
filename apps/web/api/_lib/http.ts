// Utilidades compartilhadas dos handlers serverless (Vercel).
import type { VercelRequest, VercelResponse } from '@vercel/node';

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function json(res: VercelResponse, status: number, data: unknown) {
  res.status(status).json(data);
}

export function error(res: VercelResponse, status: number, message: string, code = 'ERROR') {
  res.status(status).json({ error: { code, message } });
}

export async function readBody(req: VercelRequest): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'));
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/** Exige usuário autenticado; responde 401 e retorna null se inválido. */
export async function requireUser(req: VercelRequest, res: VercelResponse) {
  const { getUserFromRequest, db } = await import('./db');
  const fakeReq = new Request(`http://localhost${req.url}`, {
    headers: { authorization: req.headers.authorization ?? '', cookie: req.headers.cookie ?? '' },
  });
  const user = await getUserFromRequest(fakeReq);
  if (!user) { error(res, 401, 'Não autenticado', 'UNAUTHORIZED'); return null; }
  const rawProfile = req.query?.id;
  const profileId = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
  if (profileId && (req.url ?? '').startsWith('/api/profiles/')) {
    const profile = await db.getProfile(profileId);
    if (!profile || profile.user_id !== user.id) { error(res, 403, 'Acesso negado', 'FORBIDDEN'); return null; }
  }
  return user;
}

export function methodNotAllowed(res: VercelResponse) {
  error(res, 405, 'Método não permitido', 'METHOD_NOT_ALLOWED');
}
