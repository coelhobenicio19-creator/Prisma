// /api/profiles/[id]/documents/upload — POST multipart (FormData) sobe arquivo
// para o Supabase Storage (bucket privado) e registra o documento no banco.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { json, error, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const USE_MOCK = process.env.USE_MOCK_DB === '1' || !SUPABASE_URL;
const BUCKET = 'documents';

export const config = { api: { bodyParser: false } };

async function readMultipart(req: VercelRequest): Promise<{ file?: { name: string; type: string; data: Buffer }; fields: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const ct = String(req.headers['content-type'] ?? '');
      const m = ct.match(/boundary=(.+)$/);
      if (!m) return resolve({ fields: {} });
      const boundary = '--' + m[1];
      const parts = buf.toString('binary').split(boundary).slice(1, -1);
      const fields: Record<string, string> = {};
      let file: any;
      for (const p of parts) {
        const [head, ...rest] = p.split('\r\n\r\n');
        const body = rest.join('\r\n\r\n').replace(/\r\n$/, '');
        const nameM = head.match(/name="([^"]+)"/);
        const fileM = head.match(/filename="([^"]*)"/);
        const typeM = head.match(/Content-Type:\s*(.+)/i);
        if (!nameM) continue;
        if (fileM) {
          file = { name: fileM[1], type: typeM ? typeM[1].trim() : 'application/octet-stream', data: Buffer.from(body, 'binary') };
        } else {
          fields[nameM[1]] = body;
        }
      }
      resolve({ file, fields });
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return methodNotAllowed(res);

  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  const { file } = await readMultipart(req);
  if (!file || !file.name) return error(res, 400, 'Arquivo ausente', 'VALIDATION');

  const hash = createHash('sha256').update(file.data).digest('hex');
  const storagePath = `${user.id}/${profileId}/${hash}-${file.name.replace(/[^\w.\-]/g, '_')}`;

  if (!USE_MOCK) {
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file.data as unknown as BodyInit,
    });
    if (!up.ok && up.status !== 409) return error(res, 502, 'Falha no upload do arquivo', 'STORAGE_ERROR');
  }

  const doc = await db.createDocument({
    profile_id: profileId,
    title: file.name,
    content_hash: hash,
    storage_path: storagePath,
    file_size: file.data.length,
    mime_type: file.type || 'application/octet-stream',
    language: 'pt-BR',
    ocr_status: 'pending',
    extraction_status: 'pending',
  });
  return json(res, 201, doc);
}
