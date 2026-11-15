-- PRISMA Database Schema - Migration 002
-- FTS5 Search Index with triggers for automatic synchronization

PRAGMA foreign_keys = ON;

-- ============================================================
-- FTS5 VIRTUAL TABLE FOR UNIVERSAL SEARCH
-- ============================================================

CREATE VIRTUAL TABLE search_index USING fts5(
    entity_type,           -- 'question', 'document', 'conversation', 'note', 'task'
    entity_id UNINDEXED,   -- UUID da entidade
    title,                 -- Título/título do item
    content,               -- Conteúdo pesquisável (texto completo)
    tags,                  -- Tags serializadas
    profile_id UNINDEXED,  -- UUID do perfil (para filtro)
    source_type UNINDEXED, -- Tipo de fonte (para filtro)
    created_at UNINDEXED,  -- Data de criação (para ordenação)
    tokenize = 'unicode61 remove_diacritics 1'
);

-- ============================================================
-- TRIGGERS PARA MANTER FTS5 SINCRONIZADO
-- ============================================================

-- Trigger para document (INSERT)
CREATE TRIGGER document_fts_insert AFTER INSERT ON document BEGIN
    INSERT INTO search_index(entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
    SELECT 
        'document', 
        NEW.id, 
        NEW.title, 
        '', -- conteúdo será preenchido via extração posterior
        '', 
        (SELECT profile_id FROM study_profile LIMIT 1), -- fallback, idealmente viria do contexto
        (SELECT type FROM source WHERE id = (SELECT source_id FROM source_version WHERE id = NEW.source_version_id)),
        NEW.created_at;
END;

-- Trigger para document (UPDATE)
CREATE TRIGGER document_fts_update AFTER UPDATE ON document BEGIN
    UPDATE search_index 
    SET title = NEW.title,
        content = '', -- será atualizado pela extração
        source_type = (SELECT type FROM source WHERE id = (SELECT source_id FROM source_version WHERE id = NEW.source_version_id))
    WHERE entity_type = 'document' AND entity_id = NEW.id;
END;

-- Trigger para document (DELETE - soft delete via deleted_at)
CREATE TRIGGER document_fts_delete AFTER UPDATE OF deleted_at ON document WHEN NEW.deleted_at IS NOT NULL BEGIN
    DELETE FROM search_index WHERE entity_type = 'document' AND entity_id = NEW.id;
END;

-- Trigger para question (INSERT)
CREATE TRIGGER question_fts_insert AFTER INSERT ON question BEGIN
    INSERT INTO search_index(entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
    SELECT 
        'question', 
        NEW.id, 
        '', -- questões não têm título separado
        NEW.stem, 
        COALESCE(NEW.tags_json, '[]'),
        (SELECT profile_id FROM study_profile LIMIT 1), -- fallback
        NEW.origin,
        NEW.created_at;
END;

-- Trigger para question (UPDATE)
CREATE TRIGGER question_fts_update AFTER UPDATE ON question BEGIN
    UPDATE search_index 
    SET content = NEW.stem,
        tags = COALESCE(NEW.tags_json, '[]'),
        source_type = NEW.origin
    WHERE entity_type = 'question' AND entity_id = NEW.id;
END;

-- Trigger para question (DELETE - soft delete)
CREATE TRIGGER question_fts_delete AFTER UPDATE OF deleted_at ON question WHEN NEW.deleted_at IS NOT NULL BEGIN
    DELETE FROM search_index WHERE entity_type = 'question' AND entity_id = NEW.id;
END;

-- Trigger para lia_conversation (INSERT)
CREATE TRIGGER conversation_fts_insert AFTER INSERT ON lia_conversation BEGIN
    INSERT INTO search_index(entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
    VALUES (
        'conversation',
        NEW.id,
        COALESCE(NEW.title, 'Conversa sem título'),
        '',
        '',
        NEW.profile_id,
        'lia',
        NEW.created_at
    );
END;

-- Trigger para lia_conversation (UPDATE)
CREATE TRIGGER conversation_fts_update AFTER UPDATE ON lia_conversation BEGIN
    UPDATE search_index 
    SET title = COALESCE(NEW.title, 'Conversa sem título')
    WHERE entity_type = 'conversation' AND entity_id = NEW.id;
END;

-- Trigger para lia_message (INSERT) - indexar conteúdo das mensagens
CREATE TRIGGER message_fts_insert AFTER INSERT ON lia_message BEGIN
    INSERT INTO search_index(entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
    SELECT 
        'message',
        NEW.id,
        'Mensagem da LIA',
        NEW.content,
        '',
        lc.profile_id,
        'lia',
        NEW.created_at
    FROM lia_conversation lc WHERE lc.id = NEW.conversation_id;
END;

-- Trigger para task (INSERT)
CREATE TRIGGER task_fts_insert AFTER INSERT ON task BEGIN
    INSERT INTO search_index(entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
    SELECT 
        'task',
        NEW.id,
        NEW.title,
        COALESCE(NEW.description, ''),
        '',
        p.profile_id,
        'project',
        NEW.created_at
    FROM project p WHERE p.id = NEW.project_id;
END;

-- Trigger para task (UPDATE)
CREATE TRIGGER task_fts_update AFTER UPDATE ON task BEGIN
    UPDATE search_index 
    SET title = NEW.title,
        content = COALESCE(NEW.description, '')
    WHERE entity_type = 'task' AND entity_id = NEW.id;
END;

-- Trigger para study_session (INSERT)
CREATE TRIGGER study_session_fts_insert AFTER INSERT ON study_session BEGIN
    INSERT INTO search_index(entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
    VALUES (
        'study_session',
        NEW.id,
        'Sessão de estudo',
        COALESCE(NEW.notes, ''),
        COALESCE(NEW.topic_ids_json, '[]'),
        NEW.profile_id,
        'study',
        NEW.created_at
    );
END;

-- ============================================================
-- FUNÇÃO AUXILIAR PARA REINDEXAÇÃO MANUAL
-- ============================================================

-- View para facilitar reindexação completa
CREATE VIEW v_search_reindex_documents AS
SELECT 
    d.id as entity_id,
    'document' as entity_type,
    d.title,
    '' as content,
    '' as tags,
    sp.id as profile_id,
    s.type as source_type,
    d.created_at
FROM document d
JOIN source_version sv ON d.source_version_id = sv.id
JOIN source s ON sv.source_id = s.id
CROSS JOIN (SELECT id FROM study_profile LIMIT 1) sp
WHERE d.deleted_at IS NULL;

CREATE VIEW v_search_reindex_questions AS
SELECT 
    q.id as entity_id,
    'question' as entity_type,
    '' as title,
    q.stem as content,
    COALESCE(q.tags_json, '[]') as tags,
    sp.id as profile_id,
    q.origin as source_type,
    q.created_at
FROM question q
CROSS JOIN (SELECT id FROM study_profile LIMIT 1) sp
WHERE q.deleted_at IS NULL;

CREATE VIEW v_search_reindex_conversations AS
SELECT 
    lc.id as entity_id,
    'conversation' as entity_type,
    COALESCE(lc.title, 'Conversa sem título') as title,
    '' as content,
    '' as tags,
    lc.profile_id,
    'lia' as source_type,
    lc.created_at
FROM lia_conversation lc;

CREATE VIEW v_search_reindex_tasks AS
SELECT 
    t.id as entity_id,
    'task' as entity_type,
    t.title,
    COALESCE(t.description, '') as content,
    '' as tags,
    p.profile_id,
    'project' as source_type,
    t.created_at
FROM task t
JOIN project p ON t.project_id = p.id;

CREATE VIEW v_search_reindex_study_sessions AS
SELECT 
    ss.id as entity_id,
    'study_session' as entity_type,
    'Sessão de estudo' as title,
    COALESCE(ss.notes, '') as content,
    COALESCE(ss.topic_ids_json, '[]') as tags,
    ss.profile_id,
    'study' as source_type,
    ss.created_at
FROM study_session ss;