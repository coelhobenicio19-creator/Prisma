// Handler CRUD genérico para as tabelas da migration 004.
// Toda rota valida: usuário autenticado + profile pertence ao usuário.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from './http';
import { db } from './db';

export function crudHandler(table: string, opts: { idParam?: string } = {}) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    const user = await requireUser(req, res);
    if (!user) return;
    const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id as string;
    const profile = await db.getProfile(profileId);
    if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

    const rawId = opts.idParam ? req.query[opts.idParam] : undefined;
    const rowId = rawId === undefined ? undefined : (Array.isArray(rawId) ? rawId[0] : rawId);

    if (req.method === 'GET') {
      if (rowId) {
        const row = await db.gGet<any>(table, rowId);
        if (!row || row.profile_id !== profileId) return error(res, 404, 'Não encontrado', 'NOT_FOUND');
        return json(res, 200, row);
      }
      return json(res, 200, await db.gList(table, profileId));
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      delete body.id; delete body.created_at; delete body.updated_at;
      const row = await db.gInsert(table, { ...body, profile_id: profileId });
      return json(res, 201, row);
    }
    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!rowId) return error(res, 400, 'id da linha ausente na rota', 'VALIDATION');
      const existing = await db.gGet<any>(table, rowId);
      if (!existing || existing.profile_id !== profileId) return error(res, 404, 'Não encontrado', 'NOT_FOUND');
      const body = await readBody(req);
      delete (body as any).id; delete (body as any).profile_id; delete (body as any).created_at;
      return json(res, 200, await db.gUpdate(table, rowId, body));
    }
    if (req.method === 'DELETE') {
      if (!rowId) return error(res, 400, 'id da linha ausente na rota', 'VALIDATION');
      const existing = await db.gGet<any>(table, rowId);
      if (!existing || existing.profile_id !== profileId) return error(res, 404, 'Não encontrado', 'NOT_FOUND');
      await db.gDelete(table, rowId);
      return json(res, 204, null);
    }
    return methodNotAllowed(res);
  };
}
