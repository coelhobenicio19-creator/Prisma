// /api/profiles/[id]/lia/conversations/[cid] — GET mensagens, POST adiciona mensagem
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../../../_lib/http';
import { db } from '../../../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const convId = Array.isArray(req.query.cid) ? req.query.cid[0] : req.query.cid;
  const conversation = await db.gGet<{ profile_id: string }>('lia_conversation', convId);
  if (!conversation || conversation.profile_id !== profileId) return error(res, 404, 'Conversa não encontrada', 'NOT_FOUND');

  if (req.method === 'GET') return json(res, 200, await db.getConversationMessages(convId));
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (!body.role || !body.content) return error(res, 400, 'role e content obrigatórios', 'VALIDATION');
    const m = await db.addMessage({ conversation_id: convId, profile_id: profileId, role: String(body.role), content: String(body.content), tool_calls: body.tool_calls ?? null, tool_call_id: body.tool_call_id ?? null, tokens_input: body.tokens_input ?? null, tokens_output: body.tokens_output ?? null });
    return json(res, 201, m);
  }
  return methodNotAllowed(res);
}
