-- PRISMA Database Schema - Migration 001
-- Initial schema with all core tables

PRAGMA foreign_keys = ON;

-- ============================================================
-- PERFIL E METAS
-- ============================================================

CREATE TABLE study_profile (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('free','exam','contest','olympiad','course','self_study')),
    goal_description TEXT,
    target_exam_id TEXT REFERENCES exam(id),
    institution_id TEXT REFERENCES institution(id),
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_study_profile_deleted ON study_profile(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE goal (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date TEXT,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_goal_profile ON goal(profile_id) WHERE deleted_at IS NULL;

CREATE TABLE institution (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    website TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE exam (
    id TEXT NOT NULL PRIMARY KEY,
    institution_id TEXT NOT NULL REFERENCES institution(id),
    name TEXT NOT NULL,
    edition TEXT,
    date TEXT,
    description TEXT,
    official_url TEXT,
    official_hash TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','open','closed','cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE exam_edition (
    id TEXT NOT NULL PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    edition_number INTEGER,
    date TEXT,
    official_url TEXT,
    official_hash TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CONTEÚDO ACADÊMICO (ATLAS)
-- ============================================================

CREATE TABLE subject (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT,
    parent_id TEXT REFERENCES subject(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE topic (
    id TEXT NOT NULL PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    estimated_hours REAL,
    mastery_level REAL NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 1),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified','needs_review','unverified','generated')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_topic_subject ON topic(subject_id) WHERE deleted_at IS NULL;

CREATE TABLE prerequisite_edge (
    id TEXT NOT NULL PRIMARY KEY,
    from_topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    to_topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    strength REAL NOT NULL DEFAULT 1 CHECK (strength BETWEEN 0 AND 1),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(from_topic_id, to_topic_id)
);

CREATE INDEX idx_prereq_from ON prerequisite_edge(from_topic_id);
CREATE INDEX idx_prereq_to ON prerequisite_edge(to_topic_id);

CREATE TABLE skill (
    id TEXT NOT NULL PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    bloom_level TEXT CHECK (bloom_level IN ('remember','understand','apply','analyze','evaluate','create')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FONTES E DOCUMENTOS
-- ============================================================

CREATE TABLE source (
    id TEXT NOT NULL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('official','user_file','web','generated')),
    title TEXT NOT NULL,
    authors TEXT,
    year INTEGER,
    doi TEXT,
    isbn TEXT,
    url TEXT,
    domain TEXT,
    access_date TEXT NOT NULL DEFAULT (date('now')),
    credibility_score REAL CHECK (credibility_score BETWEEN 0 AND 1),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified','needs_review','unverified','generated')),
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE source_version (
    id TEXT NOT NULL PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES source(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    pages INTEGER,
    change_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source_id, version_number)
);

CREATE TABLE document (
    id TEXT NOT NULL PRIMARY KEY,
    source_version_id TEXT NOT NULL REFERENCES source_version(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    page_count INTEGER,
    language TEXT DEFAULT 'pt-BR',
    ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending','processing','completed','failed','not_needed')),
    extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending','processing','completed','failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_document_hash ON document(content_hash);

CREATE TABLE page (
    id TEXT NOT NULL PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    text_content TEXT,
    text_hash TEXT,
    ocr_confidence REAL,
    annotations_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(document_id, page_number)
);

CREATE TABLE content_chunk (
    id TEXT NOT NULL PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    page_id TEXT REFERENCES page(id) ON DELETE SET NULL,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    token_count INTEGER,
    embedding_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_chunk_document ON content_chunk(document_id);

CREATE TABLE citation (
    id TEXT NOT NULL PRIMARY KEY,
    source_version_id TEXT NOT NULL REFERENCES source_version(id) ON DELETE CASCADE,
    chunk_id TEXT REFERENCES content_chunk(id) ON DELETE SET NULL,
    page_id TEXT REFERENCES page(id) ON DELETE SET NULL,
    text_excerpt TEXT NOT NULL,
    location_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE evidence_link (
    id TEXT NOT NULL PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    citation_id TEXT NOT NULL REFERENCES citation(id) ON DELETE CASCADE,
    relevance REAL NOT NULL DEFAULT 1 CHECK (relevance BETWEEN 0 AND 1),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(topic_id, citation_id)
);

-- ============================================================
-- QUESTÕES E AVALIAÇÃO
-- ============================================================

CREATE TABLE question (
    id TEXT NOT NULL PRIMARY KEY,
    stem TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('single_choice','multiple_choice','essay','numeric','ordering','matching')),
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    explanation TEXT,
    origin TEXT NOT NULL CHECK (origin IN ('official','imported','generated_ai','authored')),
    source_version_id TEXT REFERENCES source_version(id) ON DELETE SET NULL,
    exam_id TEXT REFERENCES exam(id) ON DELETE SET NULL,
    exam_edition_id TEXT REFERENCES exam_edition(id) ON DELETE SET NULL,
    question_number TEXT,
    year INTEGER,
    tags_json TEXT,
    topic_ids_json TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified','needs_review','unverified','generated')),
    content_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_question_origin ON question(origin) WHERE deleted_at IS NULL;
CREATE INDEX idx_question_exam ON question(exam_id) WHERE deleted_at IS NULL;

CREATE TABLE alternative (
    id TEXT NOT NULL PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    display_order INTEGER NOT NULL
);

CREATE TABLE answer_key (
    id TEXT NOT NULL PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    correct_alternative_ids_json TEXT NOT NULL,
    essay_rubric TEXT,
    source TEXT NOT NULL CHECK (source IN ('official','imported','inferred')),
    official_url TEXT,
    divergence_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(question_id)
);

CREATE TABLE question_topic_mapping (
    id TEXT NOT NULL PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    weight REAL NOT NULL DEFAULT 1 CHECK (weight BETWEEN 0 AND 1),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(question_id, topic_id)
);

CREATE INDEX idx_question_topic ON question_topic_mapping(topic_id);

CREATE TABLE review_flag (
    id TEXT NOT NULL PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('content_error','ambiguous','outdated','duplicate','difficulty_mismatch','origin_unclear')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','rejected')),
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- ============================================================
-- PROVAS E SIMULADOS
-- ============================================================

CREATE TABLE exam_template (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    exam_profile_id TEXT REFERENCES exam(id),
    duration_minutes INTEGER NOT NULL,
    instructions TEXT,
    section_config_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE exam_session (
    id TEXT NOT NULL PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES exam_template(id),
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('training','exam')),
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','ready','running','interrupted','submitted','scored','reviewed')),
    started_at TEXT,
    ended_at TEXT,
    deadline_at TEXT,
    paused_duration_seconds INTEGER NOT NULL DEFAULT 0,
    time_remaining_seconds INTEGER,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    answers_json TEXT,
    events_json TEXT,
    integrity_alerts_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_session_profile ON exam_session(profile_id);
CREATE INDEX idx_session_state ON exam_session(state);

CREATE TABLE exam_event (
    id TEXT NOT NULL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES exam_session(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('start','pause','resume','answer_change','navigation','focus_lost','focus_gained','window_minimize','window_restore','submit','crash_recovery')),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    monotonic_ms INTEGER NOT NULL,
    payload_json TEXT,
    sequence INTEGER NOT NULL
);

CREATE TABLE integrity_alert (
    id TEXT NOT NULL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES exam_session(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('time_anomaly','focus_loss','window_minimize','multiple_submissions','clock_change','disk_full','network_loss','process_kill')),
    severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
    description TEXT,
    auto_resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE attempt (
    id TEXT NOT NULL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES exam_session(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score REAL,
    max_score REAL,
    percentage REAL,
    passed INTEGER,
    scored_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, attempt_number)
);

CREATE TABLE answer (
    id TEXT NOT NULL PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES attempt(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES question(id),
    answer_data_json TEXT NOT NULL,
    is_correct INTEGER,
    score REAL,
    max_score REAL,
    time_spent_seconds INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(attempt_id, question_id)
);

CREATE TABLE scoring_event (
    id TEXT NOT NULL PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES attempt(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES question(id),
    rule_applied TEXT,
    points_awarded REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- APRENDIZAGEM (MASTERY, ERROR LAB, RECALL)
-- ============================================================

CREATE TABLE mastery_evidence (
    id TEXT NOT NULL PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('exam_answer','recall_card','error_lab','study_session','manual')),
    source_id TEXT NOT NULL,
    evidence_value REAL NOT NULL CHECK (evidence_value BETWEEN -1 AND 1),
    weight REAL NOT NULL DEFAULT 1 CHECK (weight BETWEEN 0 AND 10),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_evidence_topic ON mastery_evidence(topic_id, profile_id);

CREATE TABLE error_record (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES question(id),
    attempt_id TEXT REFERENCES attempt(id) ON DELETE SET NULL,
    answer_id TEXT REFERENCES answer(id) ON DELETE SET NULL,
    cause_hypothesis TEXT NOT NULL CHECK (cause_hypothesis IN ('concept','calculation','interpretation','haste','forgetting','other')),
    cause_confirmed INTEGER NOT NULL DEFAULT 0,
    confirmed_cause TEXT CHECK (confirmed_cause IN ('concept','calculation','interpretation','haste','forgetting','other')),
    context_json TEXT,
    recurrence_count INTEGER NOT NULL DEFAULT 1,
    last_recurrence_at TEXT,
    recovery_strategy_ids_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_error_profile ON error_record(profile_id);

CREATE TABLE error_cause_hypothesis (
    id TEXT NOT NULL PRIMARY KEY,
    error_record_id TEXT NOT NULL REFERENCES error_record(id) ON DELETE CASCADE,
    hypothesis TEXT NOT NULL CHECK (hypothesis IN ('concept','calculation','interpretation','haste','forgetting','other')),
    proposed_by TEXT NOT NULL,
    accepted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE review_card (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    deck_id TEXT NOT NULL REFERENCES review_deck(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    card_type TEXT NOT NULL DEFAULT 'basic' CHECK (card_type IN ('basic','cloze','image_occlusion','formula')),
    tags_json TEXT,
    source_topic_ids_json TEXT,
    source_document_id TEXT REFERENCES document(id) ON DELETE SET NULL,
    source_error_id TEXT REFERENCES error_record(id) ON DELETE SET NULL,
    state INTEGER NOT NULL DEFAULT 0 CHECK (state IN (0,1,2,3)),
    stability REAL NOT NULL DEFAULT 0,
    difficulty REAL NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL DEFAULT (date('now')),
    last_review TEXT,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE review_deck (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    fsrs_parameters_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_card_deck_due ON review_card(deck_id, due_date) WHERE state IN (1,2,3);

CREATE TABLE review_log (
    id TEXT NOT NULL PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES review_card(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating IN (1,2,3,4)),
    state_before INTEGER NOT NULL,
    state_after INTEGER NOT NULL,
    stability_before REAL,
    stability_after REAL,
    difficulty_before REAL,
    difficulty_after REAL,
    elapsed_days INTEGER,
    scheduled_days INTEGER,
    reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    review_duration_ms INTEGER
);

CREATE INDEX idx_review_log_card ON review_log(card_id);

CREATE TABLE study_session (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    plan_item_id TEXT REFERENCES plan_item(id) ON DELETE SET NULL,
    topic_ids_json TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_seconds INTEGER,
    focus_mode INTEGER NOT NULL DEFAULT 0,
    pomodoro_cycles INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- PLANEJAMENTO E PRODUTIVIDADE
-- ============================================================

CREATE TABLE plan (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE plan_item (
    id TEXT NOT NULL PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('study','review','exam','project','break','custom')),
    topic_ids_json TEXT,
    scheduled_start TEXT NOT NULL,
    scheduled_end TEXT NOT NULL,
    actual_start TEXT,
    actual_end TEXT,
    duration_planned_seconds INTEGER NOT NULL,
    duration_actual_seconds INTEGER,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped','rescheduled')),
    recurrence_rule TEXT,
    parent_item_id TEXT REFERENCES plan_item(id),
    justification TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_plan_item_schedule ON plan_item(scheduled_start, status);

CREATE TABLE project (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subject_id TEXT REFERENCES subject(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','archived')),
    start_date TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE project_column (
    id TEXT NOT NULL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    wip_limit INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE task (
    id TEXT NOT NULL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    column_id TEXT NOT NULL REFERENCES project_column(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    due_date TEXT,
    estimated_hours REAL,
    actual_hours REAL,
    checklist_json TEXT,
    attachment_ids_json TEXT,
    topic_ids_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_task_column ON task(column_id, position);

CREATE TABLE artifact (
    id TEXT NOT NULL PRIMARY KEY,
    task_id TEXT REFERENCES task(id) ON DELETE SET NULL,
    project_id TEXT REFERENCES project(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT,
    content_hash TEXT,
    mime_type TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- GESTÃO ESCOLAR
-- ============================================================

CREATE TABLE academic_period (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_current INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE school_subject (
    id TEXT NOT NULL PRIMARY KEY,
    period_id TEXT NOT NULL REFERENCES academic_period(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subject(id),
    name TEXT NOT NULL,
    teacher TEXT,
    schedule_json TEXT,
    grade_formula TEXT,
    target_grade REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE school_assessment (
    id TEXT NOT NULL PRIMARY KEY,
    school_subject_id TEXT NOT NULL REFERENCES school_subject(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('exam','assignment','project','participation','other')),
    weight REAL NOT NULL CHECK (weight BETWEEN 0 AND 1),
    max_score REAL NOT NULL DEFAULT 100,
    date TEXT,
    score REAL,
    is_grade_confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE attendance_record (
    id TEXT NOT NULL PRIMARY KEY,
    school_subject_id TEXT NOT NULL REFERENCES school_subject(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present','absent','late','justified')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(school_subject_id, date)
);

-- ============================================================
-- LIA E IA
-- ============================================================

CREATE TABLE lia_conversation (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    title TEXT,
    context_scope TEXT NOT NULL CHECK (context_scope IN ('profile','exam','project','topic','free')),
    context_id TEXT,
    memory_opt_in INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_lia_conv_profile ON lia_conversation(profile_id);

CREATE TABLE lia_message (
    id TEXT NOT NULL PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES lia_conversation(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
    content TEXT NOT NULL,
    tool_invocations_json TEXT,
    citations_json TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    model_id TEXT,
    latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tool_invocation (
    id TEXT NOT NULL PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES lia_message(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','executed','failed','rolled_back')),
    approved_by TEXT,
    executed_at TEXT,
    rollback_at TEXT,
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE approval (
    id TEXT NOT NULL PRIMARY KEY,
    tool_invocation_id TEXT NOT NULL REFERENCES tool_invocation(id) ON DELETE CASCADE,
    action_description TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
    decided_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ai_provenance (
    id TEXT NOT NULL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    prompt_hash TEXT,
    generation_params_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE data_sharing_consent (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    allowed INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, scope)
);

CREATE TABLE telemetry_consent (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    allowed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, category)
);

-- ============================================================
-- BACKUPS, AUDITORIA E SISTEMA
-- ============================================================

CREATE TABLE backup_record (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('full','incremental','manual','auto')),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    content_hash TEXT,
    tables_included_json TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','corrupted')),
    restore_tested_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_backup_profile ON backup_record(profile_id, created_at);

CREATE TABLE audit_event (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT REFERENCES study_profile(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_values_json TEXT,
    new_values_json TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_profile_time ON audit_event(profile_id, created_at);

CREATE TABLE user_setting (
    id TEXT NOT NULL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, key)
);