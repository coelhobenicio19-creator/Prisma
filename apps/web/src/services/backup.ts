// ============================================================
// Backup/Restore — export já existe (export.ts); aqui o import.
// Importa JSON de backup (docs/metas) via API; arquivos binários
// voltam pelo upload normal (documents/upload).
// Funções puras de parse/validação são testáveis em node.
// ============================================================

export interface BackupFile {
  kind: 'prisma-backup';
  version: number;
  exported_at: string;
  profile: { name: string; goal_type: string };
  documents: Array<{ title: string; content?: string; tags?: string[] }>;
  goals?: Array<{ title: string; target_type: string; target_value: number; period_start: string; period_end: string }>;
}

export function parseBackup(json: string): BackupFile {
  const data = JSON.parse(json);
  if (data.kind !== 'prisma-backup') throw new Error('Arquivo não é backup do PRISMA (kind ausente)');
  if (typeof data.version !== 'number') throw new Error('Versão do backup ausente');
  if (!data.profile?.name) throw new Error('Perfil ausente no backup');
  if (!Array.isArray(data.documents)) throw new Error('documents deve ser array');
  return data as BackupFile;
}

export function makeBackup(input: {
  profile: { name: string; goal_type: string };
  documents: Array<{ title: string; content?: string; tags?: string[] }>;
  goals?: BackupFile['goals'];
}): string {
  const backup: BackupFile = {
    kind: 'prisma-backup',
    version: 1,
    exported_at: new Date().toISOString(),
    profile: input.profile,
    documents: input.documents,
    goals: input.goals,
  };
  return JSON.stringify(backup, null, 2);
}

/** Lê um arquivo .json do disco (browser) e retorna o texto. */
export function readBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
