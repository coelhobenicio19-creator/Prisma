import { isAllowedAccount, isLocalMock, normalizeAccountEmail } from './private-access';
// ============================================================
// PRISMA Web — camada de dados server-side
// - Produção: Supabase (Postgres + Auth + Storage) via REST, sem SDK pesado.
// - Dev local: mock em memória (USE_MOCK_DB=1), para testes sem conta externa.
// A chave service role NUNCA vai para o frontend — só neste módulo (servidor).
// ============================================================

export interface DbProfile {
  id: string;
  user_id: string;
  name: string;
  goal_type: string;
  goal_description?: string | null;
  target_exam_id?: string | null;
  institution_id?: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface DbDocument {
  id: string;
  profile_id: string;
  title: string;
  content_hash: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  page_count?: number | null;
  language: string;
  ocr_status: string;
  extraction_status: string;
  created_at: string;
  updated_at: string;
}

export interface DbFlashcardDeck {
  id: string;
  profile_id: string;
  name: string;
  description?: string | null;
  algorithm: string;
  fsrs_params?: any;
  created_at: string;
  updated_at: string;
}

export interface DbFlashcard {
  id: string;
  deck_id: string;
  profile_id: string;
  type: string;
  front: string;
  back: string;
  extra_data?: any;
  tags: string[];
  source_type: string;
  source_id?: string | null;
  difficulty: number;
  stability: number;
  retrievability: number;
  last_review?: string | null;
  next_review?: string | null;
  reps: number;
  lapses: number;
  created_at: string;
  updated_at: string;
}

export interface DbCommitment {
  id: string;
  profile_id: string;
  title: string;
  description?: string | null;
  type: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location?: string | null;
  recurrence_rule?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface DbQuestion {
  id: string;
  profile_id: string;
  stem: string;
  type: string;
  alternatives?: any;
  correct_answer?: string | null;
  explanation?: string | null;
  subject?: string | null;
  topic?: string | null;
  difficulty?: number | null;
  source_type?: string | null;
  source_id?: string | null;
  tags: string[];
  times_seen: number;
  times_correct: number;
  created_at: string;
  updated_at: string;
}

export interface DbStudySession {
  id: string;
  profile_id: string;
  type: string;
  status: string;
  planned_duration: string;
  actual_duration?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  deck_id?: string | null;
  document_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSearchRow {
  entity_type: string;
  entity_id: string;
  title: string;
  snippet: string;
  source_type?: string;
  created_at: string;
  rank: number;
}

export interface DbDashboardData {
  upcoming_commitments: Array<{ id: string; title: string; type: string; start_at: string; end_at: string; all_day: boolean }>;
  pending_reviews: { total_due: number; due_today: number; overdue: number; by_deck: Array<{ deck_id: string; deck_name: string; due: number }> };
  recent_documents: Array<{ id: string; title: string; file_path: string; imported_at: string }>;
  study_stats: { total_study_hours: number; sessions_this_week: number; current_streak_days: number; focus_sessions_this_week: number; total_pomodoros: number };
  error_summary: { total_errors: number; unconfirmed_errors: number; by_cause: Array<{ cause: string; count: number }>; recent_recurrences: number };
  mastery_overview: Array<{ subject: string; topic: string; questions_total: number; accuracy: number; last_practiced: string }>;
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const USE_MOCK = isLocalMock();

// ---------- Mock em memória (dev/testes) ----------
const mock = {
  profiles: new Map<string, DbProfile>(),
  documents: new Map<string, DbDocument>(),
  decks: new Map<string, DbFlashcardDeck>(),
  flashcards: new Map<string, DbFlashcard>(),
  commitments: new Map<string, DbCommitment>(),
  questions: new Map<string, DbQuestion>(),
  sessions: new Map<string, DbStudySession>(),
  search: [] as DbSearchRow[],
};

const mockAchievements: any[] = [];

// Tabelas genéricas (migration 004): exam, exam_attempt, atlas_node, atlas_edge,
// project, project_task, school_subject, school_grade, studio_document,
// lab_experiment, oral_session, planner_task
const mockGeneric = new Map<string, any[]>();

function uuid(): string {
  return crypto.randomUUID();
}

// ---------- Supabase REST ----------
async function sb<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Interface única usada pelos handlers ----------
export const db = {
  // Profiles
  async createProfile(p: Omit<DbProfile, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<DbProfile> {
    if (USE_MOCK) {
      const row: DbProfile = { ...p, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), version: 1 };
      mock.profiles.set(row.id, row);
      return row;
    }
    const rows = await sb<DbProfile[]>('study_profile?select=*', { method: 'POST', body: JSON.stringify(p) });
    return rows[0];
  },

  async listProfiles(userId: string): Promise<DbProfile[]> {
    if (USE_MOCK) return [...mock.profiles.values()].filter((p) => p.user_id === userId);
    return sb<DbProfile[]>(`study_profile?user_id=eq.${userId}&select=*&order=created_at.desc`);
  },

  async getProfile(id: string): Promise<DbProfile | null> {
    if (USE_MOCK) return mock.profiles.get(id) ?? null;
    const rows = await sb<DbProfile[]>(`study_profile?id=eq.${id}&select=*&limit=1`);
    return rows[0] ?? null;
  },

  async updateProfile(id: string, updates: Partial<DbProfile>): Promise<DbProfile | null> {
    if (USE_MOCK) {
      const cur = mock.profiles.get(id);
      if (!cur) return null;
      const row = { ...cur, ...updates, updated_at: new Date().toISOString(), version: cur.version + 1 };
      mock.profiles.set(id, row);
      return row;
    }
    const rows = await sb<DbProfile[]>(`study_profile?id=eq.${id}&select=*`, { method: 'PATCH', body: JSON.stringify(updates) });
    return rows[0] ?? null;
  },

  async deleteProfile(id: string): Promise<void> {
    if (USE_MOCK) { mock.profiles.delete(id); return; }
    await sb(`study_profile?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },

  // Documents
  async createDocument(d: Omit<DbDocument, 'id' | 'created_at' | 'updated_at'>): Promise<DbDocument> {
    if (USE_MOCK) {
      const row: DbDocument = { ...d, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mock.documents.set(row.id, row);
      return row;
    }
    const rows = await sb<DbDocument[]>('document?select=*', { method: 'POST', body: JSON.stringify(d) });
    return rows[0];
  },

  async listDocuments(profileId: string): Promise<DbDocument[]> {
    if (USE_MOCK) return [...mock.documents.values()].filter((d) => d.profile_id === profileId);
    return sb<DbDocument[]>(`document?profile_id=eq.${profileId}&select=*&order=created_at.desc`);
  },

  async getDocument(id: string): Promise<DbDocument | null> {
    if (USE_MOCK) return mock.documents.get(id) ?? null;
    const rows = await sb<DbDocument[]>(`document?id=eq.${id}&select=*&limit=1`);
    return rows[0] ?? null;
  },

  async deleteDocument(id: string): Promise<void> {
    if (USE_MOCK) { mock.documents.delete(id); return; }
    await sb(`document?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },

  // Flashcard Decks
  async createDeck(d: Omit<DbFlashcardDeck, 'id' | 'created_at' | 'updated_at'>): Promise<DbFlashcardDeck> {
    if (USE_MOCK) {
      const row: DbFlashcardDeck = { ...d, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mock.decks.set(row.id, row);
      return row;
    }
    const rows = await sb<DbFlashcardDeck[]>('flashcard_deck?select=*', { method: 'POST', body: JSON.stringify(d) });
    return rows[0];
  },

  async listDecks(profileId: string): Promise<DbFlashcardDeck[]> {
    if (USE_MOCK) return [...mock.decks.values()].filter((d) => d.profile_id === profileId);
    return sb<DbFlashcardDeck[]>(`flashcard_deck?profile_id=eq.${profileId}&select=*&order=created_at.desc`);
  },

  async getDeck(id: string): Promise<DbFlashcardDeck | null> {
    if (USE_MOCK) return mock.decks.get(id) ?? null;
    const rows = await sb<DbFlashcardDeck[]>(`flashcard_deck?id=eq.${id}&select=*&limit=1`);
    return rows[0] ?? null;
  },

  async updateDeck(id: string, updates: Partial<DbFlashcardDeck>): Promise<DbFlashcardDeck | null> {
    if (USE_MOCK) {
      const cur = mock.decks.get(id);
      if (!cur) return null;
      const row = { ...cur, ...updates, updated_at: new Date().toISOString() };
      mock.decks.set(id, row);
      return row;
    }
    const rows = await sb<DbFlashcardDeck[]>(`flashcard_deck?id=eq.${id}&select=*`, { method: 'PATCH', body: JSON.stringify(updates) });
    return rows[0] ?? null;
  },

  async deleteDeck(id: string): Promise<void> {
    if (USE_MOCK) { mock.decks.delete(id); return; }
    await sb(`flashcard_deck?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },

  // Flashcards
  async createFlashcard(f: Omit<DbFlashcard, 'id' | 'created_at' | 'updated_at'>): Promise<DbFlashcard> {
    if (USE_MOCK) {
      const row: DbFlashcard = { ...f, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mock.flashcards.set(row.id, row);
      return row;
    }
    const rows = await sb<DbFlashcard[]>('flashcard?select=*', { method: 'POST', body: JSON.stringify(f) });
    return rows[0];
  },

  async listFlashcards(deckId: string): Promise<DbFlashcard[]> {
    if (USE_MOCK) return [...mock.flashcards.values()].filter((f) => f.deck_id === deckId);
    return sb<DbFlashcard[]>(`flashcard?deck_id=eq.${deckId}&select=*&order=created_at.desc`);
  },

  async getDueFlashcards(profileId: string, limit = 50): Promise<DbFlashcard[]> {
    if (USE_MOCK) {
      const now = new Date().toISOString();
      return [...mock.flashcards.values()]
        .filter((f) => f.profile_id === profileId && f.next_review && f.next_review <= now)
        .slice(0, limit);
    }
    return sb<DbFlashcard[]>(`flashcard?profile_id=eq.${profileId}&next_review=lte.${new Date().toISOString()}&select=*&order=next_review.asc&limit=${limit}`);
  },

  async updateFlashcard(id: string, updates: Partial<DbFlashcard>): Promise<DbFlashcard | null> {
    if (USE_MOCK) {
      const cur = mock.flashcards.get(id);
      if (!cur) return null;
      const row = { ...cur, ...updates, updated_at: new Date().toISOString() };
      mock.flashcards.set(id, row);
      return row;
    }
    const rows = await sb<DbFlashcard[]>(`flashcard?id=eq.${id}&select=*`, { method: 'PATCH', body: JSON.stringify(updates) });
    return rows[0] ?? null;
  },

  async deleteFlashcard(id: string): Promise<void> {
    if (USE_MOCK) { mock.flashcards.delete(id); return; }
    await sb(`flashcard?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },

  // Commitments
  async createCommitment(c: Omit<DbCommitment, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<DbCommitment> {
    if (USE_MOCK) {
      const row: DbCommitment = { ...c, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), version: 1 };
      mock.commitments.set(row.id, row);
      return row;
    }
    const rows = await sb<DbCommitment[]>('commitment?select=*', { method: 'POST', body: JSON.stringify(c) });
    return rows[0];
  },

  async listCommitments(profileId: string, from?: string, to?: string): Promise<DbCommitment[]> {
    if (USE_MOCK) {
      let arr = [...mock.commitments.values()].filter((c) => c.profile_id === profileId);
      if (from) arr = arr.filter((c) => c.start_at >= from);
      if (to) arr = arr.filter((c) => c.start_at <= to);
      return arr.sort((a, b) => a.start_at.localeCompare(b.start_at));
    }
    let path = `commitment?profile_id=eq.${profileId}&select=*&order=start_at.asc`;
    if (from) path += `&start_at=gte.${from}`;
    if (to) path += `&start_at=lte.${to}`;
    return sb<DbCommitment[]>(path);
  },

  async getCommitment(id: string): Promise<DbCommitment | null> {
    if (USE_MOCK) return mock.commitments.get(id) ?? null;
    const rows = await sb<DbCommitment[]>(`commitment?id=eq.${id}&select=*&limit=1`);
    return rows[0] ?? null;
  },

  async updateCommitment(id: string, updates: Partial<DbCommitment>): Promise<DbCommitment | null> {
    if (USE_MOCK) {
      const cur = mock.commitments.get(id);
      if (!cur) return null;
      const row = { ...cur, ...updates, updated_at: new Date().toISOString(), version: cur.version + 1 };
      mock.commitments.set(id, row);
      return row;
    }
    const rows = await sb<DbCommitment[]>(`commitment?id=eq.${id}&select=*`, { method: 'PATCH', body: JSON.stringify(updates) });
    return rows[0] ?? null;
  },

  async deleteCommitment(id: string): Promise<void> {
    if (USE_MOCK) { mock.commitments.delete(id); return; }
    await sb(`commitment?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },

  // Questions
  async createQuestion(q: Omit<DbQuestion, 'id' | 'created_at' | 'updated_at' | 'times_seen' | 'times_correct'>): Promise<DbQuestion> {
    if (USE_MOCK) {
      const row: DbQuestion = { ...q, id: uuid(), times_seen: 0, times_correct: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mock.questions.set(row.id, row);
      return row;
    }
    const rows = await sb<DbQuestion[]>('question?select=*', { method: 'POST', body: JSON.stringify(q) });
    return rows[0];
  },

  async listQuestions(profileId: string, subject?: string, topic?: string): Promise<DbQuestion[]> {
    if (USE_MOCK) {
      let arr = [...mock.questions.values()].filter((q) => q.profile_id === profileId);
      if (subject) arr = arr.filter((q) => q.subject === subject);
      if (topic) arr = arr.filter((q) => q.topic === topic);
      return arr;
    }
    let path = `question?profile_id=eq.${profileId}&select=*&order=created_at.desc`;
    if (subject) path += `&subject=eq.${subject}`;
    if (topic) path += `&topic=eq.${topic}`;
    return sb<DbQuestion[]>(path);
  },

  async getQuestion(id: string): Promise<DbQuestion | null> {
    if (USE_MOCK) return mock.questions.get(id) ?? null;
    const rows = await sb<DbQuestion[]>(`question?id=eq.${id}&select=*&limit=1`);
    return rows[0] ?? null;
  },

  async updateQuestionStats(id: string, isCorrect: boolean): Promise<void> {
    if (USE_MOCK) {
      const cur = mock.questions.get(id);
      if (cur) {
        cur.times_seen += 1;
        if (isCorrect) cur.times_correct += 1;
        cur.updated_at = new Date().toISOString();
      }
      return;
    }
    const q = await this.getQuestion(id);
    if (q) {
      await sb(`question?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          times_seen: q.times_seen + 1,
          times_correct: q.times_correct + (isCorrect ? 1 : 0),
        }),
      });
    }
  },

  // Study Sessions
  async createSession(s: Omit<DbStudySession, 'id' | 'created_at' | 'updated_at'>): Promise<DbStudySession> {
    if (USE_MOCK) {
      const row: DbStudySession = { ...s, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mock.sessions.set(row.id, row);
      return row;
    }
    const rows = await sb<DbStudySession[]>('study_session?select=*', { method: 'POST', body: JSON.stringify(s) });
    return rows[0];
  },

  async listSessions(profileId: string, from?: string, to?: string): Promise<DbStudySession[]> {
    if (USE_MOCK) {
      let arr = [...mock.sessions.values()].filter((s) => s.profile_id === profileId);
      if (from) arr = arr.filter((s) => s.started_at && s.started_at >= from);
      if (to) arr = arr.filter((s) => s.started_at && s.started_at <= to);
      return arr.sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''));
    }
    let path = `study_session?profile_id=eq.${profileId}&select=*&order=started_at.desc`;
    if (from) path += `&started_at=gte.${from}`;
    if (to) path += `&started_at=lte.${to}`;
    return sb<DbStudySession[]>(path);
  },

  async updateSession(id: string, updates: Partial<DbStudySession>): Promise<DbStudySession | null> {
    if (USE_MOCK) {
      const cur = mock.sessions.get(id);
      if (!cur) return null;
      const row = { ...cur, ...updates, updated_at: new Date().toISOString() };
      mock.sessions.set(id, row);
      return row;
    }
    const rows = await sb<DbStudySession[]>(`study_session?id=eq.${id}&select=*`, { method: 'PATCH', body: JSON.stringify(updates) });
    return rows[0] ?? null;
  },

  // Search (full-text + vector)
  async search(profileId: string, query: string, limit = 20): Promise<DbSearchRow[]> {
    if (USE_MOCK) {
      const q = query.toLowerCase();
      return mock.search
        .filter((r) => r.title.toLowerCase().includes(q) || r.snippet.toLowerCase().includes(q))
        .slice(0, limit);
    }
    // Full-text search via pg_trgm + tsvector
    return sb<DbSearchRow[]>(
      `search_index?profile_id=eq.${profileId}&search_text=ilike.%25${encodeURIComponent(query)}%25&select=*&order=created_at.desc&limit=${limit}`
    );
  },

  // Vector search (RAG) - usando RPC
  async vectorSearch(profileId: string, embedding: number[], limit = 10): Promise<Array<{ id: string; document_id: string; content: string; similarity: number }>> {
    if (USE_MOCK) return [];
    const data = await sb<any>(`rpc/vector_search?p_profile_id=${profileId}&p_embedding=${JSON.stringify(embedding)}&p_limit=${limit}`);
    return data;
  },

  // Dashboard (RPC agregado)
  async dashboard(profileId: string): Promise<DbDashboardData> {
    if (USE_MOCK) {
      return {
        upcoming_commitments: [],
        pending_reviews: { total_due: 0, due_today: 0, overdue: 0, by_deck: [] },
        recent_documents: [...mock.documents.values()]
          .filter((d) => d.profile_id === profileId)
          .slice(0, 5)
          .map((d) => ({ id: d.id, title: d.title, file_path: d.storage_path, imported_at: d.created_at })),
        study_stats: { total_study_hours: 0, sessions_this_week: 0, current_streak_days: 0, focus_sessions_this_week: 0, total_pomodoros: 0 },
        error_summary: { total_errors: 0, unconfirmed_errors: 0, by_cause: [], recent_recurrences: 0 },
        mastery_overview: [],
      };
    }
    const data = await sb<any>(`rpc/dashboard_data?p_profile_id=${profileId}`);
    return data;
  },

  // Goals
  async createGoal(g: { profile_id: string; title: string; description?: string; target_type: string; target_value: number; period_start: string; period_end: string }): Promise<any> {
    if (USE_MOCK) return { ...g, id: uuid(), current_value: 0, achieved: false, created_at: new Date().toISOString() };
    return sb('goal?select=*', { method: 'POST', body: JSON.stringify(g) });
  },

  async listGoals(profileId: string): Promise<any[]> {
    if (USE_MOCK) return [];
    return sb(`goal?profile_id=eq.${profileId}&select=*&order=period_end.asc`);
  },

  // Notifications
  async createNotification(n: { profile_id: string; type: string; title: string; body?: string; channel: string; payload?: any; scheduled_for: string }): Promise<any> {
    if (USE_MOCK) return { ...n, id: uuid(), created_at: new Date().toISOString() };
    return sb('notification?select=*', { method: 'POST', body: JSON.stringify(n) });
  },

  async listNotifications(profileId: string, unreadOnly = false): Promise<any[]> {
    if (USE_MOCK) return [];
    let path = `notification?profile_id=eq.${profileId}&select=*&order=scheduled_for.asc`;
    if (unreadOnly) path += `&read_at=is.null`;
    return sb(path);
  },

  async markNotificationRead(id: string): Promise<void> {
    if (USE_MOCK) return;
    await sb(`notification?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ read_at: new Date().toISOString() }) });
  },

  // LIA Conversations
  async createConversation(c: { profile_id: string; title?: string; model?: string }): Promise<any> {
    if (USE_MOCK) return { ...c, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    return sb('lia_conversation?select=*', { method: 'POST', body: JSON.stringify(c) });
  },

  async listConversations(profileId: string): Promise<any[]> {
    if (USE_MOCK) return [];
    return sb(`lia_conversation?profile_id=eq.${profileId}&select=*&order=updated_at.desc`);
  },

  async addMessage(m: { conversation_id: string; profile_id: string; role: string; content: string; tool_calls?: any; tool_call_id?: string; tokens_input?: number; tokens_output?: number }): Promise<any> {
    if (USE_MOCK) return { ...m, id: uuid(), created_at: new Date().toISOString() };
    return sb('lia_message?select=*', { method: 'POST', body: JSON.stringify(m) });
  },

  async getConversationMessages(conversationId: string): Promise<any[]> {
    if (USE_MOCK) return [];
    return sb(`lia_message?conversation_id=eq.${conversationId}&select=*&order=created_at.asc`);
  },

  // Achievements (gamificação)
  async listAchievements(profileId: string): Promise<any[]> {
    if (USE_MOCK) return mockAchievements.filter((a) => a.profile_id === profileId);
    return sb(`achievement?profile_id=eq.${profileId}&select=*&order=earned_at.desc`);
  },

  async unlockAchievement(profileId: string, a: { code: string; name: string; description?: string; icon?: string; tier?: string }): Promise<any> {
    if (USE_MOCK) {
      const existing = mockAchievements.find((x) => x.profile_id === profileId && x.code === a.code);
      if (existing) return existing;
      const row = { ...a, id: uuid(), profile_id: profileId, tier: a.tier ?? 'bronze', earned_at: new Date().toISOString(), metadata: null };
      mockAchievements.push(row);
      return row;
    }
    // ON CONFLICT do nothing via PostgREST: tenta inserir; se 409, busca existente
    try {
      const rows = await sb<any[]>('achievement?select=*', { method: 'POST', body: JSON.stringify({ profile_id: profileId, ...a, tier: a.tier ?? 'bronze' }) });
      return rows[0];
    } catch {
      return sb(`achievement?profile_id=eq.${profileId}&code=eq.${a.code}&select=*&limit=1`);
    }
  },

  async getProfileSettings(profileId: string): Promise<Record<string, unknown> | null> {
    if (USE_MOCK) return (mockGeneric.get('profile_settings') ?? []).find((row) => row.profile_id === profileId) ?? null;
    const rows = await sb<Record<string, unknown>[]>(`profile_settings?profile_id=eq.${profileId}&select=*&limit=1`);
    return rows[0] ?? null;
  },
  async upsertProfileSettings(profileId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (USE_MOCK) {
      const rows = mockGeneric.get('profile_settings') ?? [];
      const index = rows.findIndex((row) => row.profile_id === profileId);
      const row = { ...(index >= 0 ? rows[index] : {}), ...patch, profile_id: profileId };
      if (index >= 0) rows[index] = row; else rows.push(row);
      mockGeneric.set('profile_settings', rows);
      return row;
    }
    const rows = await sb<Record<string, unknown>[]>('profile_settings?on_conflict=profile_id&select=*', { method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=representation'}, body:JSON.stringify({...patch,profile_id:profileId}) });
    return rows[0];
  },

  // ---------- CRUD genérico (tabelas novas da migration 004) ----------
  // Todas as tabelas têm profile_id e RLS; o handler já validou posse do profile.
  async gList<T>(table: string, profileId: string, extra = ''): Promise<T[]> {
    if (USE_MOCK) {
      const rows = mockGeneric.get(table) ?? [];
      return rows.filter((r: any) => r.profile_id === profileId) as T[];
    }
    return sb<T[]>(`${table}?profile_id=eq.${profileId}&select=*&order=created_at.desc${extra}`);
  },
  async gGet<T>(table: string, id: string): Promise<T | null> {
    if (USE_MOCK) return (mockGeneric.get(table) ?? []).find((r: any) => r.id === id) ?? null;
    const rows = await sb<T[]>(`${table}?id=eq.${id}&select=*&limit=1`);
    return rows[0] ?? null;
  },
  async gInsert<T>(table: string, row: Record<string, unknown>): Promise<T> {
    if (USE_MOCK) {
      const r = { ...row, id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      if (!mockGeneric.has(table)) mockGeneric.set(table, []);
      (mockGeneric.get(table) as any[]).push(r);
      return r as T;
    }
    const rows = await sb<T[]>(`${table}?select=*`, { method: 'POST', body: JSON.stringify(row) });
    return rows[0];
  },
  async gUpdate<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T | null> {
    if (USE_MOCK) {
      const rows = mockGeneric.get(table) ?? [];
      const i = rows.findIndex((r: any) => r.id === id);
      if (i < 0) return null;
      rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
      return rows[i] as T;
    }
    const rows = await sb<T[]>(`${table}?id=eq.${id}&select=*`, { method: 'PATCH', body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }) });
    return rows[0] ?? null;
  },
  async gDelete(table: string, id: string): Promise<void> {
    if (USE_MOCK) {
      const rows = mockGeneric.get(table) ?? [];
      mockGeneric.set(table, rows.filter((r: any) => r.id !== id));
      return;
    }
    await sb(`${table}?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },
  async gQuery<T>(table: string, query: string): Promise<T[]> {
    if (USE_MOCK) {
      // mock: soporta só profile_id=eq.X (usado pelos handlers via gList)
      const m = query.match(/profile_id=eq\.([^&]+)/);
      const rows = mockGeneric.get(table) ?? [];
      return (m ? rows.filter((r: any) => r.profile_id === m[1]) : rows) as T[];
    }
    return sb<T[]>(`${table}?${query}&select=*`);
  },
};

// ---------- Auth: valida o JWT do usuário no Supabase ----------
export async function getUserFromRequest(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : getCookie(req, 'sb-access-token');
  if (!token) return null;
  if (USE_MOCK) {
    // mock: aceita token "mock:<userId>:<email>" (dois-pontos, para não quebrar UUID)
    if (token.startsWith('mock:')) {
      const rest = token.slice(5);
      const sep = rest.indexOf(':');
      const id = sep >= 0 ? rest.slice(0, sep) : rest;
      const email = sep >= 0 ? rest.slice(sep + 1) : 'dono@local';
      return isAllowedAccount(email) ? { id, email: normalizeAccountEmail(email) } : null;
    }
    return null;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || token.startsWith('mock:')) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const u = await res.json();
  return u.id && isAllowedAccount(u.email) ? { id: u.id, email: normalizeAccountEmail(u.email) } : null;
}

function getCookie(req: Request, name: string): string | null {
  const c = req.headers.get('cookie') ?? '';
  const m = c.split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='));
  return m ? m.slice(name.length + 1) : null;
}
