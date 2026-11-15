import { describe, it, expect } from 'vitest';
import { parseBackup, makeBackup } from '../src/services/backup';

describe('backup/restore — parse e make', () => {
  it('makeBackup gera JSON válido kind=prisma-backup', () => {
    const json = makeBackup({
      profile: { name: 'ENEM 2026', goal_type: 'exam' },
      documents: [{ title: 'Aula 1', content: 'texto', tags: ['mat'] }],
    });
    const b = JSON.parse(json);
    expect(b.kind).toBe('prisma-backup');
    expect(b.version).toBe(1);
    expect(b.documents.length).toBe(1);
  });

  it('parseBackup valida e retorna', () => {
    const json = makeBackup({ profile: { name: 'X', goal_type: 'course' }, documents: [] });
    const b = parseBackup(json);
    expect(b.profile.name).toBe('X');
  });

  it('parseBackup rejeita arquivo que não é backup', () => {
    expect(() => parseBackup('{"foo":1}')).toThrow('não é backup');
  });

  it('parseBackup rejeita sem documents array', () => {
    expect(() => parseBackup(JSON.stringify({ kind: 'prisma-backup', version: 1, profile: { name: 'x' } }))).toThrow('documents');
  });

  it('roundtrip make→parse preserva dados', () => {
    const original = {
      profile: { name: 'ENEM', goal_type: 'exam' },
      documents: [{ title: 'Doc A', content: 'abc', tags: ['a', 'b'] }],
      goals: [{ title: '30h', target_type: 'hours', target_value: 30, period_start: '2026-11-01', period_end: '2026-11-30' }],
    };
    const parsed = parseBackup(makeBackup(original));
    expect(parsed.documents[0].tags).toEqual(['a', 'b']);
    expect(parsed.goals?.[0].target_value).toBe(30);
  });
});
