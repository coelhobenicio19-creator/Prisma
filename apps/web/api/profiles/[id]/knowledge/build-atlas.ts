// /api/profiles/[id]/knowledge/build-atlas — POST gera nós iniciais do Atlas a partir do perfil
// (conhecimento DECLARADO — mastery começa 0; nunca tratado como dominado)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';
import { buildInitialAtlas } from '../../../_lib/knowledge';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return methodNotAllowed(res);
  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  const kp = (await db.gQuery<any>('knowledge_profile', `profile_id=eq.${profileId}`))[0];
  if (!kp) return error(res, 400, 'Perfil de conhecimento ausente — conclua o onboarding primeiro', 'NO_PROFILE');

  const wanted = buildInitialAtlas({
    interests: kp.interests ?? [],
    favorite_subjects: kp.favorite_subjects ?? [],
    difficult_subjects: kp.difficult_subjects ?? [],
    free_text: kp.free_text ?? '',
  });
  const existing = await db.gList<any>('atlas_node', profileId);
  const existingKeys = new Set(existing.map((n: any) => `${n.subject}::${n.topic}`));
  const created: any[] = [];
  for (const w of wanted) {
    const key = `${w.subject}::${w.topic}`;
    if (existingKeys.has(key)) continue;
    created.push(await db.gInsert('atlas_node', { profile_id: profileId, subject: w.subject, topic: w.topic, mastery: 0, source_question_count: 0 }));
    await db.gInsert('knowledge_entry', {
      profile_id: profileId, kind: 'declared', subject: w.subject, topic: w.topic,
      confidence: 0.3, source: 'onboarding', allow_lia: kp.consent?.lia_use !== false,
    });
  }
  return json(res, 201, { created: created.length, nodes: created });
}
