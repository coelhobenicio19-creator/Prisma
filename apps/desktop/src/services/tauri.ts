import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { appDataDir, join } from '@tauri-apps/api/path';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

// ============================================================
// Types
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
// Profile Commands
// ============================================================

export async function createProfile(
  name: string,
  goal_type: 'free' | 'exam' | 'contest' | 'olympiad' | 'course' | 'self_study',
  goal_description?: string,
  target_exam_id?: string,
  institution_id?: string,
  timezone?: string
): Promise<StudyProfile> {
  return invoke('create_profile', {
    name,
    goal_type,
    goal_description,
    target_exam_id,
    institution_id,
    timezone,
  });
}

export async function getProfile(id: string): Promise<StudyProfile | null> {
  return invoke('get_profile', { id });
}

export async function listProfiles(): Promise<StudyProfile[]> {
  return invoke('list_profiles');
}

export async function updateProfile(
  id: string,
  updates: Partial<Omit<StudyProfile, 'id' | 'created_at' | 'deleted_at' | 'version'>>
): Promise<StudyProfile> {
  return invoke('update_profile', { id, ...updates });
}

export async function deleteProfile(id: string): Promise<void> {
  return invoke('delete_profile', { id });
}

// ============================================================
// Settings Commands
// ============================================================

export async function getSettings(profileId: string): Promise<SettingsData> {
  return invoke('get_settings', { profile_id: profileId });
}

export async function updateSettings(
  profileId: string,
  settings: Partial<SettingsData>
): Promise<SettingsData> {
  return invoke('update_settings', { profile_id: profileId, ...settings });
}

export async function exportData(profileId: string): Promise<string> {
  return invoke('export_data', { profile_id: profileId });
}

export async function importData(profileId: string, jsonData: string): Promise<void> {
  return invoke('import_data', { profile_id: profileId, json_data: jsonData });
}

export async function createBackup(
  profileId: string,
  type: 'full' | 'incremental' | 'manual' | 'auto' = 'manual'
): Promise<string> {
  return invoke('create_backup', { profile_id: profileId, backup_type: type });
}

export async function listBackups(profileId: string): Promise<BackupRecord[]> {
  return invoke('list_backups', { profile_id: profileId });
}

// ============================================================
// Library Commands
// ============================================================

export async function importFile(profileId: string, filePath: string): Promise<Document> {
  return invoke('import_file', { profile_id: profileId, file_path: filePath });
}

export async function listDocuments(profileId: string): Promise<Document[]> {
  return invoke('list_documents', { profile_id: profileId });
}

export async function getDocument(id: string): Promise<Document | null> {
  return invoke('get_document', { id });
}

export async function deleteDocument(id: string): Promise<void> {
  return invoke('delete_document', { id });
}

export async function openDocument(id: string): Promise<string> {
  return invoke('open_document', { id });
}

// ============================================================
// Search Commands
// ============================================================

export async function search(profileId: string, params: SearchQuery): Promise<SearchResult[]> {
  return invoke('search', { profile_id: profileId, params });
}

export async function reindex(profileId: string): Promise<number> {
  return invoke('reindex', { profile_id: profileId });
}

// ============================================================
// Dashboard Commands
// ============================================================

export async function getDashboardData(profileId: string): Promise<DashboardData> {
  return invoke('get_dashboard_data', { profile_id: profileId });
}

// ============================================================
// Dialog Helpers
// ============================================================

export async function pickFile(options?: {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
  directory?: boolean;
}): Promise<string | string[] | null> {
  const result = await open({
    title: options?.title,
    filters: options?.filters,
    multiple: options?.multiple ?? false,
    directory: options?.directory ?? false,
  });
  return result ?? null;
}

export async function pickFolder(title?: string): Promise<string | null> {
  const result = await open({
    title,
    directory: true,
  });
  return result ?? null;
}

// ============================================================
// Clipboard Helpers
// ============================================================

export async function copyToClipboard(text: string): Promise<void> {
  return writeText(text);
}

export async function readFromClipboard(): Promise<string> {
  return readText();
}

// ============================================================
// Notification Helpers
// ============================================================

export async function showNotification(
  title: string,
  body: string,
  options?: { icon?: string; onClick?: () => void }
): Promise<void> {
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }
  
  if (permissionGranted) {
    sendNotification({ title, body, icon: options?.icon });
  }
}

// ============================================================
// Path Helpers
// ============================================================

export async function getAppDataDir(): Promise<string> {
  return appDataDir();
}

export async function getDbPath(): Promise<string> {
  const dir = await appDataDir();
  return join(dir, 'prisma.db');
}

// ============================================================
// Error Handling
// ============================================================

export class TauriError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'TauriError';
  }
}

export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<{ data?: T; error?: TauriError }> {
  try {
    const data = await invoke<T>(command, args);
    return { data };
  } catch (error: unknown) {
    const tauriError = error as { message?: string; code?: string };
    return {
      error: new TauriError(
        tauriError.message || 'Erro desconhecido',
        tauriError.code || 'UNKNOWN_ERROR',
        error
      ),
    };
  }
}