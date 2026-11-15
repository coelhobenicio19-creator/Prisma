import { describe, it, expect, beforeAll } from 'vitest';

process.env.USE_MOCK_DB = '1';

import { db } from '../api/_lib/db';
import { executeToolCall } from '../api/_lib/lia/tools';
import { memory } from '../api/_lib/lia/memory';

const USER = '00000000-0000-0000-0000-000000000001';
let profileId = '';
let deckId = '';

beforeAll(async () => {
  const p = await db.createProfile({ user_id: USER, name: 'Teste', goal_type: 'exam', timezone: 'America/Sao_Paulo' });
  profileId = p.id;
  const d = await db.createDeck({ profile_id: profileId, name: 'Deck LIA', algorithm: 'fsrs' });
  deckId = d.id;
});

describe('LIA tools (mock db)', () => {
  it('create_flashcards cria cards no deck', async () => {
    const res = await executeToolCall({
      id: 'c1', type: 'function',
      function: { name: 'create_flashcards', arguments: JSON.stringify({ deck_id: deckId, cards: [{ front: 'Q1', back: 'A1' }, { front: 'Q2', back: 'A2' }] }) },
    }, profileId, USER);
    expect(res.content).toContain('2 flashcards criados');
    const cards = await db.listFlashcards(deckId);
    expect(cards.length).toBe(2);
  });

  it('create_flashcards rejeita deck de outro perfil', async () => {
    const other = await db.createProfile({ user_id: 'outro-user', name: 'Outro', goal_type: 'course', timezone: 'UTC' });
    const otherDeck = await db.createDeck({ profile_id: other.id, name: 'Deck outro', algorithm: 'fsrs' });
    const res = await executeToolCall({
      id: 'c2', type: 'function',
      function: { name: 'create_flashcards', arguments: JSON.stringify({ deck_id: otherDeck.id, cards: [{ front: 'x', back: 'y' }] }) },
    }, profileId, USER);
    expect(res.content).toContain('sem permissão');
  });

  it('schedule_review cria compromisso do tipo review', async () => {
    const res = await executeToolCall({
      id: 'c3', type: 'function',
      function: { name: 'schedule_review', arguments: JSON.stringify({ title: 'Revisar Cap 1', start_at: '2026-11-15T10:00:00Z', end_at: '2026-11-15T11:00:00Z' }) },
    }, profileId, USER);
    expect(res.content).toContain('agendada');
    const list = await db.listCommitments(profileId);
    expect(list.some((c) => c.title === 'Revisar Cap 1' && c.type === 'review')).toBe(true);
  });

  it('get_dashboard retorna estrutura válida', async () => {
    const res = await executeToolCall({ id: 'c4', type: 'function', function: { name: 'get_dashboard', arguments: '{}' } }, profileId, USER);
    const data = JSON.parse(res.content);
    expect(data).toHaveProperty('study_stats');
    expect(data).toHaveProperty('pending_reviews');
  });

  it('ferramenta desconhecida retorna erro amigável', async () => {
    const res = await executeToolCall({ id: 'c5', type: 'function', function: { name: 'delete_everything', arguments: '{}' } }, profileId, USER);
    expect(res.content).toContain('desconhecida');
  });
});

describe('LIA memory — só grava com fonte', () => {
  it('rejeita memória sem fonte', async () => {
    const r = await memory.remember(profileId, { kind: 'fact', content: 'gosta de estudar de manhã' });
    expect(r).toBeNull();
  });

  it('grava fato verificado com fonte user', async () => {
    const r = await memory.remember(profileId, { kind: 'preference', content: 'preferecards à noite', source: 'user', confidence: 0.9 });
    expect(r).not.toBeNull();
    expect(r!.verified).toBe(true);
    const prompt = await memory.formatForPrompt(profileId);
    expect(prompt).toContain('preferecards');
  });
});

describe('isolamento — handlers sem auth retornam 401', () => {
  it('getUserFromRequest sem token retorna null', async () => {
    const { getUserFromRequest } = await import('../api/_lib/db');
    const req = new Request('http://localhost/api/profiles', { headers: {} });
    const u = await getUserFromRequest(req);
    expect(u).toBeNull();
  });

  it('getUserFromRequest com token inválido (mock) retorna null', async () => {
    const { getUserFromRequest } = await import('../api/_lib/db');
    const req = new Request('http://localhost/api/profiles', { headers: { authorization: 'Bearer token-invalido' } });
    const u = await getUserFromRequest(req);
    expect(u).toBeNull();
  });

  it('token mock válido retorna usuário', async () => {
    const { getUserFromRequest } = await import('../api/_lib/db');
    const req = new Request('http://localhost/api/profiles', { headers: { authorization: `Bearer mock:${USER}:dono@local` } });
    const u = await getUserFromRequest(req);
    expect(u).not.toBeNull();
    expect(u!.id).toBe(USER);
  });
});
