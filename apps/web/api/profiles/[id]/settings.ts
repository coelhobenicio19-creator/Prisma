import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, json, methodNotAllowed, readBody, requireUser } from '../../_lib/http';
import { db } from '../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');
  if (req.method === 'GET') return json(res, 200, { theme:'system', language:'pt-BR', telemetry_enabled:false, telemetry_categories:{usage:false,performance:false,errors:false,ai_usage:false}, auto_backup:false, backup_interval_hours:24, ...(await db.getProfileSettings(profileId)), ai_api_key_configured:!!process.env.NVIDIA_API_KEY });
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readBody(req);
    const allowed = ['theme','language','telemetry_enabled','telemetry_categories','auto_backup','backup_interval_hours'];
    const patch = Object.fromEntries(allowed.filter((key)=>body[key]!==undefined).map((key)=>[key,body[key]]));
    if (patch.theme !== undefined && !['system','light','dark'].includes(String(patch.theme))) return error(res,400,'Tema inválido','VALIDATION');
    return json(res,200,{...(await db.upsertProfileSettings(profileId,patch)),ai_api_key_configured:!!process.env.NVIDIA_API_KEY});
  }
  return methodNotAllowed(res);
}
