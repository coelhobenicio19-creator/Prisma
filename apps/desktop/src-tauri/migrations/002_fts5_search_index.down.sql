-- Rollback for Migration 002 - Drop FTS5 index and triggers

DROP TRIGGER IF EXISTS study_session_fts_insert;
DROP TRIGGER IF EXISTS task_fts_update;
DROP TRIGGER IF EXISTS task_fts_insert;
DROP TRIGGER IF EXISTS message_fts_insert;
DROP TRIGGER IF EXISTS conversation_fts_update;
DROP TRIGGER IF EXISTS conversation_fts_insert;
DROP TRIGGER IF EXISTS question_fts_delete;
DROP TRIGGER IF EXISTS question_fts_update;
DROP TRIGGER IF EXISTS question_fts_insert;
DROP TRIGGER IF EXISTS document_fts_delete;
DROP TRIGGER IF EXISTS document_fts_update;
DROP TRIGGER IF EXISTS document_fts_insert;

DROP VIEW IF EXISTS v_search_reindex_study_sessions;
DROP VIEW IF EXISTS v_search_reindex_tasks;
DROP VIEW IF EXISTS v_search_reindex_conversations;
DROP VIEW IF EXISTS v_search_reindex_questions;
DROP VIEW IF EXISTS v_search_reindex_documents;

DROP TABLE IF EXISTS search_index;