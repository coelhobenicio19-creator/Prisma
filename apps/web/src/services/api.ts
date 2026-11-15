// ============================================================
// PRISMA Web — API client (substitui services/tauri.ts)
// Toda comunicação com o backend passa por /api/* (serverless).
// A sessão é enviada via cookie httpOnly gerenciado pelo servidor.
// ============================================================

// ============================================================
// Types (idênticos ao contrato do backend — espelham models.rs)
// ============================================================

export interface StudyProfile {
  id: string;
  name: string;
  goal_type: 'free' | 'exam' | 'contest' | 'olympiad' | 'course' | 'self_study';
  goal_description?: string;
  target_exam_id?: string;
  institution_id?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

export interface Goal {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  target_date?: string;
  priority: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

export interface Institution {
  id: string;
  name: string;
  code?: string;
  website?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  institution_id: string;
  name: string;
  edition?: string;
  date?: string;
  description?: string;
  official_url?: string;
  official_hash?: string;
  status: 'planned' | 'open' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  difficulty?: number;
  estimated_hours?: number;
  mastery_level: number;
  verification_status: 'verified' | 'needs_review' | 'unverified' | 'generated';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

export interface Document {
  id: string;
  source_version_id: string;
  title: string;
  content_hash: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  page_count?: number;
  language: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_needed';
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  snippet: string;
  source_type?: string;
  created_at: string;
  rank: number;
}

export interface SearchQuery {
  query: string;
  entity_types?: string[];
  source_types?: string[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardData {
  upcoming_commitments: UpcomingCommitment[];
  pending_reviews: PendingReviews;
  recent_documents: RecentDocument[];
  study_stats: StudyStats;
  error_summary: ErrorSummary;
  mastery_overview: MasteryTopic[];
}

export interface UpcomingCommitment {
  id: string;
  title: string;
  type: string;
  scheduled_at: string;
  due_in_hours: number;
}

export interface PendingReviews {
  total_due: number;
  due_today: number;
  overdue: number;
  by_deck: DeckReviewCount[];
}

export interface DeckReviewCount {
  deck_id: string;
  deck_name: string;
  due_count: number;
}

export interface RecentDocument {
  id: string;
  title: string;
  file_path: string;
  imported_at: string;
}

export interface StudyStats {
  total_study_hours: number;
  sessions_this_week: number;
  current_streak_days: number;
  focus_sessions_this_week: number;
  total_pomodoros: number;
}

export interface ErrorSummary {
  total_errors: number;
  unconfirmed_errors: number;
  by_cause: ErrorCauseCount[];
  recent_recurrences: number;
}

export interface ErrorCauseCount {
  cause: string;
  count: number;
}

export interface MasteryTopic {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  mastery_level: number;
  evidence_count: number;
}

export interface SettingsData {
  theme: string;
  language: string;
  telemetry_enabled: boolean;
  telemetry_categories: {
    usage: boolean;
    performance: boolean;
    errors: boolean;
    ai_usage: boolean;
  };
  ai_api_key_configured: boolean;
  auto_backup: boolean;
  backup_interval_hours: number;
}

export interface BackupRecord {
  id: string;
  profile_id: string;
  type: number;
  file_path: string;
  file_size?: number;
  content_hash?: string;
  tables_included_json?: string;
  status: number;
  restore_tested_at?: string;
  created_at: string;
}

export interface TelemetryCategories {
  usage: boolean;
  performance: boolean;
  errors: boolean;
  ai_usage: boolean;
}

// ============================================================
// HTTP core
// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE: string = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // cookie httpOnly de sessão
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (res.status === 401) {
    // sessão expirada/inválida — redireciona para login
    if (!path.startsWith('/auth/') && window.location.pathname !== '/login') window.location.href = '/login';
    throw new ApiError('Sessão expirada', 'UNAUTHORIZED', 401);
  }
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch { /* resposta sem JSON */ }
    throw new ApiError(message, 'API_ERROR', res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ============================================================
// Auth
// ============================================================

export interface SessionUser {
  id: string;
  email: string;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  return request<SessionUser>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    return await request<SessionUser>('/auth/session');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

// ============================================================
// Gamificação (achievements) — Fase 5
// ============================================================

export interface Achievement {
  id: string;
  profile_id: string;
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  tier: string;
  earned_at: string;
}

export async function listAchievements(profileId: string): Promise<Achievement[]> {
  return request<Achievement[]>(`/profiles/${profileId}/achievements`);
}

export async function unlockAchievement(profileId: string, a: { code: string; name: string; description?: string; icon?: string; tier?: string }): Promise<Achievement> {
  return request<Achievement>(`/profiles/${profileId}/achievements`, { method: 'POST', body: JSON.stringify(a) });
}

// ============================================================
// Profile
// ============================================================

export async function createProfile(
  name: string,
  goal_type: StudyProfile['goal_type'],
  goal_description?: string,
  target_exam_id?: string,
  institution_id?: string,
  timezone?: string
): Promise<StudyProfile> {
  return request<StudyProfile>('/profiles', {
    method: 'POST',
    body: JSON.stringify({ name, goal_type, goal_description, target_exam_id, institution_id, timezone }),
  });
}

export async function getProfile(id: string): Promise<StudyProfile | null> {
  return request<StudyProfile | null>(`/profiles/${id}`);
}

export async function listProfiles(): Promise<StudyProfile[]> {
  return request<StudyProfile[]>('/profiles');
}

export async function updateProfile(
  id: string,
  updates: Partial<Omit<StudyProfile, 'id' | 'created_at' | 'deleted_at' | 'version'>>
): Promise<StudyProfile> {
  return request<StudyProfile>(`/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteProfile(id: string): Promise<void> {
  await request<void>(`/profiles/${id}`, { method: 'DELETE' });
}

// ============================================================
// Settings
// ============================================================

export async function getSettings(profileId: string): Promise<SettingsData> {
  return request<SettingsData>(`/profiles/${profileId}/settings`);
}

export async function updateSettings(profileId: string, settings: Partial<SettingsData>): Promise<SettingsData> {
  return request<SettingsData>(`/profiles/${profileId}/settings`, { method: 'PUT', body: JSON.stringify(settings) });
}

export async function exportData(profileId: string): Promise<string> {
  return request<string>(`/profiles/${profileId}/export`, { method: 'POST' });
}

export async function importData(profileId: string, jsonData: string): Promise<void> {
  await request<void>(`/profiles/${profileId}/import`, { method: 'POST', body: JSON.stringify({ json_data: jsonData }) });
}

export async function createBackup(
  profileId: string,
  type: 'full' | 'incremental' | 'manual' | 'auto' = 'manual'
): Promise<string> {
  return request<string>(`/profiles/${profileId}/backups`, { method: 'POST', body: JSON.stringify({ backup_type: type }) });
}

export async function listBackups(profileId: string): Promise<BackupRecord[]> {
  return request<BackupRecord[]>(`/profiles/${profileId}/backups`);
}

// ============================================================
// Library (upload via FormData — substitui pickFile + import_file)
// ============================================================

export async function uploadDocument(profileId: string, file: File): Promise<Document> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/profiles/${profileId}/documents/upload`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  if (!res.ok) throw new ApiError(`Upload falhou (${res.status})`, 'UPLOAD_ERROR', res.status);
  return res.json() as Promise<Document>;
}

export async function listDocuments(profileId: string): Promise<Document[]> {
  return request<Document[]>(`/profiles/${profileId}/documents`);
}

export async function getDocument(id: string): Promise<Document | null> {
  return request<Document | null>(`/documents/${id}`);
}

export async function deleteDocument(id: string): Promise<void> {
  await request<void>(`/documents/${id}`, { method: 'DELETE' });
}

export async function getDocumentDownloadUrl(id: string): Promise<string> {
  return request<string>(`/documents/${id}/download-url`);
}

// Mantido para compatibilidade — no web abre o arquivo pela URL assinada
export async function openDocument(id: string): Promise<string> {
  const url = await getDocumentDownloadUrl(id);
  window.open(url, '_blank', 'noopener');
  return url;
}

// ============================================================
// Search
// ============================================================

export async function search(profileId: string, params: SearchQuery): Promise<SearchResult[]> {
  return request<SearchResult[]>(`/profiles/${profileId}/search`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function reindex(profileId: string): Promise<number> {
  return request<number>(`/profiles/${profileId}/search/reindex`, { method: 'POST' });
}

// ============================================================
// Dashboard
// ============================================================

export async function getDashboardData(profileId: string): Promise<DashboardData> {
  return request<DashboardData>(`/profiles/${profileId}/dashboard`);
}

// ============================================================
// LIA (chat com streaming SSE)
// ============================================================

export interface LiaMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
}

export interface LiaConversation {
  id: string;
  profile_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function listConversations(profileId: string): Promise<LiaConversation[]> {
  return request<LiaConversation[]>(`/profiles/${profileId}/lia/conversations`);
}

export async function getConversation(profileId: string, conversationId: string): Promise<LiaMessage[]> {
  return request<LiaMessage[]>(`/profiles/${profileId}/lia/conversations/${conversationId}`);
}

/** Envia mensagem e recebe stream SSE; onToken é chamado a cada token. */
export async function liaChat(
  profileId: string,
  conversationIdParam: string | null,
  message: string,
  onToken: (text: string) => void
): Promise<{ conversation_id: string; full_text: string }> {
  const res = await fetch(`${API_BASE}/profiles/${profileId}/lia/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({ conversation_id: conversationIdParam, message }),
  });
  if (!res.ok || !res.body) throw new ApiError('Falha no chat da LIA', 'LIA_ERROR', res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let newConversationId = conversationIdParam ?? '';
  let pending = '';
  const consume = (line: string) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    let event: { error?: unknown; conversation_id?: string; token?: string; done?: boolean; full_text?: string };
    try { event = JSON.parse(payload); } catch { return; }
    if (event.error) throw new ApiError(String(event.error), 'LIA_STREAM_ERROR', 502);
    if (event.conversation_id) newConversationId = event.conversation_id;
    if (event.token) { full += event.token; onToken(event.token); }
    if (event.done && typeof event.full_text === 'string') full = event.full_text;
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? '';
      for (const line of lines) consume(line);
      if (done) { if (pending) consume(pending); break; }
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (!full.trim()) throw new ApiError('A LIA não retornou uma resposta. Tente novamente.', 'LIA_EMPTY_RESPONSE', 502);
  return { conversation_id: newConversationId, full_text: full };
}

// ============================================================
// Helpers de navegador (substituem plugins Tauri)
// ============================================================

export async function pickFile(options?: {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
}): Promise<File | File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options?.multiple) input.multiple = true;
    if (options?.filters) {
      input.accept = options.filters
        .flatMap((f) => f.extensions.map((e) => `.${e}`))
        .join(',');
    }
    input.onchange = () => {
      const files = input.files;
      if (!files || files.length === 0) return resolve(null);
      resolve(options?.multiple ? Array.from(files) : files[0]);
    };
    input.click();
  });
}

export async function pickFolder(): Promise<string | null> {
  // Web não expõe caminhos reais de pastas; retorna null (upload dir via input webkitdirectory)
  return null;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function readFromClipboard(): Promise<string> {
  return navigator.clipboard.readText();
}

export async function showNotification(
  title: string,
  body: string,
  options?: { icon?: string; onClick?: () => void }
): Promise<void> {
  if (!('Notification' in window)) return;
  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') return;
  const n = new Notification(title, { body, icon: options?.icon });
  if (options?.onClick) n.onclick = options.onClick;
}

// ============================================================
// Error handling (mantém compatibilidade com safeInvoke)
// ============================================================

export class TauriError extends ApiError {}

export async function safeInvoke<T>(
  path: string,
  init?: RequestInit
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const data = await request<T>(path, init);
    return { data };
  } catch (error: unknown) {
    if (error instanceof ApiError) return { error };
    return { error: new ApiError('Erro desconhecido', 'UNKNOWN_ERROR', 0, error) };
  }
}

// ============================================================
// Flashcards / Recall (FSRS) — endpoints reais do servidor
// ============================================================

export interface FlashcardDeck {
  id: string; profile_id: string; name: string; description?: string;
  card_count?: number; created_at: string; updated_at: string;
}
export interface Flashcard {
  id: string; deck_id: string; front: string; back: string;
  difficulty: number; stability: number; retrievability: number;
  reps: number; lapses: number; due_at?: string | null; created_at: string; updated_at: string;
}

export async function listDecks(profileId: string): Promise<FlashcardDeck[]> {
  return request<FlashcardDeck[]>(`/profiles/${profileId}/flashcards`);
}
export async function createDeck(profileId: string, name: string, description?: string): Promise<FlashcardDeck> {
  return request<FlashcardDeck>(`/profiles/${profileId}/flashcards`, {
    method: 'POST', body: JSON.stringify({ name, description }),
  });
}
export async function listCards(profileId: string, deckId: string): Promise<Flashcard[]> {
  return request<Flashcard[]>(`/profiles/${profileId}/flashcards/${deckId}/cards`);
}
export async function createCard(profileId: string, deckId: string, front: string, back: string): Promise<Flashcard> {
  return request<Flashcard>(`/profiles/${profileId}/flashcards/${deckId}/cards`, {
    method: 'POST', body: JSON.stringify({ front, back }),
  });
}
export async function getDueCards(profileId: string, limit = 50): Promise<Flashcard[]> {
  return request<Flashcard[]>(`/profiles/${profileId}/flashcards/due?limit=${limit}`);
}
export async function reviewCard(profileId: string, cardId: string, rating: 1 | 2 | 3 | 4): Promise<Flashcard> {
  return request<Flashcard>(`/profiles/${profileId}/flashcards/review`, {
    method: 'POST', body: JSON.stringify({ card_id: cardId, rating }),
  });
}

// ============================================================
// Questions / Error Lab / Exam Intelligence
// ============================================================

export interface Question {
  id: string; profile_id: string; stem: string; type: string;
  alternatives?: string[] | null; correct_answer?: string | null;
  explanation?: string | null; subject?: string | null; topic?: string | null;
  difficulty?: number | null; tags: string[];
  times_seen: number; times_correct: number; created_at: string; updated_at: string;
}

export async function listQuestions(profileId: string, subject?: string, topic?: string): Promise<Question[]> {
  const q = new URLSearchParams();
  if (subject) q.set('subject', subject);
  if (topic) q.set('topic', topic);
  const qs = q.toString();
  return request<Question[]>(`/profiles/${profileId}/questions${qs ? `?${qs}` : ''}`);
}
export async function createQuestion(profileId: string, q: Partial<Question> & { stem: string; type: string }): Promise<Question> {
  return request<Question>(`/profiles/${profileId}/questions`, { method: 'POST', body: JSON.stringify(q) });
}
export async function answerQuestion(profileId: string, questionId: string, correct: boolean): Promise<{ times_seen: number; times_correct: number }> {
  return request(`/profiles/${profileId}/questions/${questionId}/answer`, {
    method: 'POST', body: JSON.stringify({ correct }),
  });
}

// ============================================================
// Sessões (Learn / Focus) e Compromissos (Planner/School)
// ============================================================

export interface StudySession {
  id: string; profile_id: string; type: string; status: string;
  planned_duration: string; actual_duration?: string | null;
  started_at?: string | null; ended_at?: string | null;
  deck_id?: string | null; document_id?: string | null; notes?: string | null;
  created_at: string; updated_at: string;
}
export async function listSessions(profileId: string, from?: string, to?: string): Promise<StudySession[]> {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return request<StudySession[]>(`/profiles/${profileId}/sessions${qs ? `?${qs}` : ''}`);
}
export async function createSession(profileId: string, s: {
  type: string; planned_duration: number; status?: string; actual_duration?: number;
  started_at?: string; ended_at?: string; deck_id?: string; document_id?: string; notes?: string;
}): Promise<StudySession> {
  return request<StudySession>(`/profiles/${profileId}/sessions`, { method: 'POST', body: JSON.stringify(s) });
}

export interface Commitment {
  id: string; profile_id: string; title: string; description?: string | null;
  type: string; start_at: string; end_at: string; all_day: boolean;
  location?: string | null; created_at: string; updated_at: string; version: number;
}
export async function listCommitments(profileId: string, from?: string, to?: string): Promise<Commitment[]> {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return request<Commitment[]>(`/profiles/${profileId}/commitments${qs ? `?${qs}` : ''}`);
}
export async function createCommitment(profileId: string, c: { title: string; type: string; start_at: string; end_at: string; all_day?: boolean; location?: string }): Promise<Commitment> {
  return request<Commitment>(`/profiles/${profileId}/commitments`, { method: 'POST', body: JSON.stringify(c) });
}

// ============================================================
// Metas (goals) e Notificações
// ============================================================

export interface StudyGoal {
  id: string; profile_id: string; title: string; description?: string | null;
  target_type: string; target_value: number; period_start: string; period_end: string;
  status?: string; created_at: string;
}
export async function listGoals(profileId: string): Promise<StudyGoal[]> {
  return request<StudyGoal[]>(`/profiles/${profileId}/goals`);
}
export async function createGoal(profileId: string, g: { title: string; description?: string; target_type: string; target_value: number; period_start: string; period_end: string }): Promise<StudyGoal> {
  return request<StudyGoal>(`/profiles/${profileId}/goals`, { method: 'POST', body: JSON.stringify(g) });
}

export interface AppNotification {
  id: string; profile_id: string; type: string; title: string; body?: string | null;
  channel: string; read?: boolean; scheduled_for: string; created_at: string;
}
export async function listNotifications(profileId: string, unreadOnly = false): Promise<AppNotification[]> {
  return request<AppNotification[]>(`/profiles/${profileId}/notifications${unreadOnly ? '?unread=true' : ''}`);
}

// ============================================================
// CRUD genérico dos módulos v2 (migration 004) — exams, atlas,
// planner, projects, school, studio, lab, oral
// ============================================================

export async function apiList<T>(profileId: string, path: string): Promise<T[]> {
  return request<T[]>(`/profiles/${profileId}/${path}`);
}
export async function apiGet<T>(profileId: string, path: string): Promise<T> {
  return request<T>(`/profiles/${profileId}/${path}`);
}
export async function apiPost<T>(profileId: string, path: string, body: unknown): Promise<T> {
  return request<T>(`/profiles/${profileId}/${path}`, { method: 'POST', body: JSON.stringify(body) });
}
export async function apiPatch<T>(profileId: string, path: string, body: unknown): Promise<T> {
  return request<T>(`/profiles/${profileId}/${path}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export async function apiDelete(profileId: string, path: string): Promise<void> {
  await request(`/profiles/${profileId}/${path}`, { method: 'DELETE' });
}

// Exams: tentativas com autosave e entrega corrigida no servidor
export interface ExamDef { id: string; title: string; description?: string | null; duration_minutes: number; question_ids: string[]; status: string; created_at: string; updated_at: string }
export interface ExamAttempt {
  id: string; exam_id: string; status: string; answers: Record<string, unknown>;
  score?: number | null; max_score?: number | null; started_at: string; submitted_at?: string | null;
}
export async function startExamAttempt(profileId: string, examId: string): Promise<ExamAttempt> {
  return apiPost(profileId, `exams/${examId}/attempts`, {});
}
export async function autosaveAttempt(profileId: string, examId: string, attemptId: string, answers: Record<string, unknown>): Promise<ExamAttempt> {
  return apiPatch(profileId, `exams/${examId}/attempts/${attemptId}`, { answers });
}
export async function submitExam(profileId: string, examId: string, attemptId: string, answers: Record<string, unknown>): Promise<{ attempt: ExamAttempt; perQuestion: Record<string, boolean>; score: number; maxScore: number }> {
  return apiPost(profileId, `exams/${examId}/attempts/${attemptId}`, { answers });
}
