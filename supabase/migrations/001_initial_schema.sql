-- PRISMA Web — Migração 001: Schema base + RLS + Storage
-- Supabase Free Tier: PostgreSQL 16 + pgvector + pg_trgm
-- Compatível com 24 módulos acadêmicos

-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- ENUMS (compatíveis com desktop)
-- ============================================================
CREATE TYPE profile_goal_type AS ENUM (
  'exam', 'course', 'certification', 'self_study', 'language', 'competition', 'free', 'contest', 'olympiad'
);
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE ocr_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE commitment_type AS ENUM ('class', 'exam', 'assignment', 'study', 'review', 'meeting', 'other');
CREATE TYPE review_source_type AS ENUM ('manual', 'flashcard', 'question', 'document', 'lia');
CREATE TYPE flashcard_type AS ENUM ('basic', 'cloze', 'image_occlusion', 'typed');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay', 'numeric', 'discursiva');
CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email');
CREATE TYPE error_cause AS ENUM (
  'concept_gap', 'misreading', 'calculation_error', 'time_pressure', 'carelessness',
  'knowledge_retrieval', 'wrong_assumption', 'unit_conversion', 'formula_miss', 'other'
);

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  IF to_jsonb(NEW) ? 'version' THEN NEW.version = OLD.version + 1; END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

-- Perfis de estudo (um usuário pode ter vários)
CREATE TABLE study_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal_type profile_goal_type NOT NULL,
  goal_description text,
  target_exam_id uuid,
  institution_id uuid,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version int NOT NULL DEFAULT 1
);
CREATE INDEX idx_study_profile_user ON study_profile(user_id);
CREATE TRIGGER trg_study_profile_updated BEFORE UPDATE ON study_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Documentos da biblioteca pessoal
CREATE TABLE document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_hash char(64) NOT NULL, -- SHA-256
  storage_path text NOT NULL,      -- caminho no bucket privado
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  page_count int,
  language text NOT NULL DEFAULT 'pt-BR',
  ocr_status ocr_status NOT NULL DEFAULT 'pending',
  extraction_status extraction_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_document_profile ON document(profile_id);
CREATE INDEX idx_document_hash ON document(content_hash);
CREATE TRIGGER trg_document_updated BEFORE UPDATE ON document
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Chunks de texto para busca vetorial (RAG)
CREATE TABLE document_chunk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(1536), -- text-embedding-3-small / nomic-embed-text
  token_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chunk_profile ON document_chunk(profile_id);
CREATE INDEX idx_chunk_document ON document_chunk(document_id);
CREATE INDEX idx_chunk_embedding ON document_chunk USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Índice full-text híbrido (pg_trgm + tsvector)
CREATE TABLE search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'document', 'flashcard', 'question', 'note', 'commitment'
  entity_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(title,'')),'A') ||
    setweight(to_tsvector('portuguese', coalesce(content,'')),'B')
  ) STORED,
  source_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_search_profile ON search_index(profile_id);
CREATE INDEX idx_search_vector ON search_index USING GIN (search_vector);
CREATE INDEX idx_search_trgm ON search_index USING GIN (title gin_trgm_ops, content gin_trgm_ops);
CREATE UNIQUE INDEX idx_search_entity ON search_index(entity_type, entity_id);

-- Compromissos/calendário
CREATE TABLE commitment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type commitment_type NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  recurrence_rule text, -- RRULE RFC5545
  source_type text,     -- 'manual', 'syllabus', 'exam_schedule'
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version int NOT NULL DEFAULT 1
);
CREATE INDEX idx_commitment_profile_time ON commitment(profile_id, start_at);
CREATE TRIGGER trg_commitment_updated BEFORE UPDATE ON commitment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Decks de flashcards (FSRS/Anki-like)
CREATE TABLE flashcard_deck (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  algorithm text NOT NULL DEFAULT 'fsrs',
  fsrs_params jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deck_profile ON flashcard_deck(profile_id);

-- Flashcards
CREATE TABLE flashcard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES flashcard_deck(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  type flashcard_type NOT NULL DEFAULT 'basic',
  front text NOT NULL,
  back text NOT NULL,
  extra_data jsonb, -- cloze deletions, image occlusion data, etc.
  tags text[],
  source_type review_source_type NOT NULL DEFAULT 'manual',
  source_id uuid,
  difficulty real NOT NULL DEFAULT 0.5,
  stability real NOT NULL DEFAULT 0.0,
  retrievability real NOT NULL DEFAULT 0.0,
  last_review timestamptz,
  next_review timestamptz,
  reps int NOT NULL DEFAULT 0,
  lapses int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_flashcard_deck_due ON flashcard(deck_id, next_review) WHERE next_review IS NOT NULL;
CREATE INDEX idx_flashcard_profile ON flashcard(profile_id);
CREATE TRIGGER trg_flashcard_updated BEFORE UPDATE ON flashcard
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sessões de estudo (pomodoro, focus, revisão)
CREATE TABLE study_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'pomodoro', 'focus', 'review', 'exam_sim', 'free'
  status session_status NOT NULL DEFAULT 'planned',
  planned_duration interval NOT NULL,
  actual_duration interval,
  started_at timestamptz,
  ended_at timestamptz,
  deck_id uuid REFERENCES flashcard_deck(id) ON DELETE SET NULL,
  document_id uuid REFERENCES document(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_profile_time ON study_session(profile_id, started_at);
CREATE TRIGGER trg_session_updated BEFORE UPDATE ON study_session
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Questões/banco de questões
CREATE TABLE question (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  stem text NOT NULL,
  type question_type NOT NULL,
  alternatives jsonb, -- [{'text':'A','correct':true},...]
  correct_answer text,
  explanation text,
  subject text,
  topic text,
  difficulty real,
  source_type text,
  source_id uuid,
  tags text[],
  times_seen int NOT NULL DEFAULT 0,
  times_correct int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_question_profile ON question(profile_id);
CREATE INDEX idx_question_topic ON question(profile_id, subject, topic);
CREATE TRIGGER trg_question_updated BEFORE UPDATE ON question
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Respostas do usuário a questões
CREATE TABLE question_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  user_answer text,
  is_correct boolean,
  time_spent interval,
  confidence int, -- 1-5
  session_id uuid REFERENCES study_session(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempt_profile_time ON question_attempt(profile_id, created_at);
CREATE INDEX idx_attempt_question ON question_attempt(question_id);

-- Erros registrados (para dashboard/análise)
CREATE TABLE error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  question_id uuid REFERENCES question(id) ON DELETE SET NULL,
  attempt_id uuid REFERENCES question_attempt(id) ON DELETE SET NULL,
  cause error_cause NOT NULL,
  description text,
  subject text,
  topic text,
  confirmed boolean NOT NULL DEFAULT false,
  recurrence_count int NOT NULL DEFAULT 1,
  first_occurrence timestamptz NOT NULL DEFAULT now(),
  last_occurrence timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_error_profile ON error_log(profile_id);
CREATE INDEX idx_error_cause ON error_log(profile_id, cause);
CREATE INDEX idx_error_recurrence ON error_log(profile_id, last_occurrence DESC);

-- Metas e objetivos
CREATE TABLE goal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_type text, -- 'hours', 'sessions', 'flashcards_reviewed', 'questions_correct', 'streak'
  target_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  achieved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_goal_profile_active ON goal(profile_id, period_end) WHERE NOT achieved;
CREATE TRIGGER trg_goal_updated BEFORE UPDATE ON goal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Notificações/lembretes
CREATE TABLE notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'review_due', 'session_reminder', 'goal_progress', 'achievement'
  title text NOT NULL,
  body text,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  payload jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  scheduled_for timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_profile_sched ON notification(profile_id, scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX idx_notification_unread ON notification(profile_id, read_at) WHERE read_at IS NULL;

-- Conquistas/gamificação
CREATE TABLE achievement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  code text NOT NULL, -- 'first_session', 'streak_7', '100_flashcards', etc.
  name text NOT NULL,
  description text,
  icon text,
  tier text NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, platinum
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);
CREATE UNIQUE INDEX idx_achievement_profile_code ON achievement(profile_id, code);
CREATE INDEX idx_achievement_profile ON achievement(profile_id);

-- Configurações do usuário (por perfil)
CREATE TABLE profile_settings (
  profile_id uuid PRIMARY KEY REFERENCES study_profile(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system', -- light, dark, system
  language text NOT NULL DEFAULT 'pt-BR',
  pomodoro_work_min int NOT NULL DEFAULT 25,
  pomodoro_break_min int NOT NULL DEFAULT 5,
  pomodoro_long_break_min int NOT NULL DEFAULT 15,
  pomodoro_sessions_before_long int NOT NULL DEFAULT 4,
  focus_sound text,
  notifications_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT false,
  auto_backup boolean NOT NULL DEFAULT false,
  backup_frequency text, -- 'daily', 'weekly'
  lia_model text,
  lia_temperature real,
  lia_max_tokens int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON profile_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Logs de chat da LIA
CREATE TABLE lia_conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lia_conv_profile ON lia_conversation(profile_id);
CREATE TRIGGER trg_lia_conv_updated BEFORE UPDATE ON lia_conversation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE lia_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES lia_conversation(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user', 'assistant', 'system', 'tool'
  content text NOT NULL,
  tool_calls jsonb,
  tool_call_id text,
  tokens_input int,
  tokens_output int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lia_msg_conv ON lia_message(conversation_id);
CREATE INDEX idx_lia_msg_profile ON lia_message(profile_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Isolamento total por usuário
-- ============================================================
ALTER TABLE study_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_deck ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE question ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lia_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE lia_message ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só vê/edita o que pertence ao seu user_id (via profile)
CREATE POLICY "own_profile" ON study_profile
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_documents" ON document
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = document.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = document.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_chunks" ON document_chunk
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = document_chunk.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = document_chunk.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_search" ON search_index
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = search_index.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = search_index.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_commitments" ON commitment
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = commitment.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = commitment.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_decks" ON flashcard_deck
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = flashcard_deck.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = flashcard_deck.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_flashcards" ON flashcard
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = flashcard.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = flashcard.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_sessions" ON study_session
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = study_session.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = study_session.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_questions" ON question
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = question.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = question.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_attempts" ON question_attempt
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = question_attempt.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = question_attempt.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_errors" ON error_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = error_log.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = error_log.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_goals" ON goal
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = goal.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = goal.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_notifications" ON notification
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = notification.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = notification.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_achievements" ON achievement
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = achievement.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = achievement.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_settings" ON profile_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = profile_settings.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = profile_settings.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_lia_conv" ON lia_conversation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lia_conversation.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lia_conversation.profile_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "own_lia_msg" ON lia_message
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lia_message.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lia_message.profile_id AND sp.user_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKET PRIVADO (via SQL)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 52428800, -- 50MB
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain','text/markdown','image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: usuários só acessam seus próprios arquivos (pasta user_id/profile_id/)
CREATE POLICY "own_storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ) WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- FUNÇÃO RPC: Dashboard agregado (performance)
-- ============================================================
CREATE OR REPLACE FUNCTION dashboard_data(p_profile_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb; tz text;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM study_profile WHERE id=p_profile_id AND (user_id=auth.uid() OR auth.role()='service_role')) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  SELECT timezone INTO tz FROM study_profile WHERE id=p_profile_id;
  SELECT jsonb_build_object(
    'upcoming_commitments', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'type',c.type,'scheduled_at',c.start_at,'due_in_hours',greatest(0,floor(extract(epoch FROM(c.start_at-now()))/3600))) ORDER BY c.start_at) FROM (SELECT * FROM commitment WHERE profile_id=p_profile_id AND start_at>=now() ORDER BY start_at LIMIT 10)c),'[]'::jsonb),
    'pending_reviews', jsonb_build_object(
      'total_due',(SELECT count(*) FROM flashcard WHERE profile_id=p_profile_id AND next_review<=now()),
      'due_today',(SELECT count(*) FROM flashcard WHERE profile_id=p_profile_id AND next_review<=now() AND (next_review AT TIME ZONE tz)::date=(now() AT TIME ZONE tz)::date),
      'overdue',(SELECT count(*) FROM flashcard WHERE profile_id=p_profile_id AND (next_review AT TIME ZONE tz)::date<(now() AT TIME ZONE tz)::date),
      'by_deck',COALESCE((SELECT jsonb_agg(jsonb_build_object('deck_id',d.id,'deck_name',d.name,'due_count',s.n)) FROM (SELECT deck_id,count(*) n FROM flashcard WHERE profile_id=p_profile_id AND next_review<=now() GROUP BY deck_id)s JOIN flashcard_deck d ON d.id=s.deck_id),'[]'::jsonb)),
    'recent_documents',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'file_path',d.storage_path,'imported_at',d.created_at) ORDER BY d.created_at DESC) FROM (SELECT * FROM document WHERE profile_id=p_profile_id ORDER BY created_at DESC LIMIT 5)d),'[]'::jsonb),
    'study_stats',jsonb_build_object(
      'total_study_hours',(SELECT COALESCE(sum(extract(epoch FROM COALESCE(actual_duration,interval '0 seconds')))/3600,0) FROM study_session WHERE profile_id=p_profile_id AND started_at>=now()-interval '7 days'),
      'sessions_this_week',(SELECT count(*) FROM study_session WHERE profile_id=p_profile_id AND started_at>=now()-interval '7 days'),
      'current_streak_days',(WITH days AS(SELECT DISTINCT(started_at AT TIME ZONE tz)::date d FROM study_session WHERE profile_id=p_profile_id AND status='completed'),anchor AS(SELECT CASE WHEN EXISTS(SELECT 1 FROM days WHERE d=(now() AT TIME ZONE tz)::date) THEN(now() AT TIME ZONE tz)::date ELSE(now() AT TIME ZONE tz)::date-1 END d),numbered AS(SELECT days.d,row_number() OVER(ORDER BY days.d DESC) n FROM days,anchor WHERE days.d<=anchor.d) SELECT count(*) FROM numbered,anchor WHERE numbered.d=anchor.d-(numbered.n::int-1)),
      'focus_sessions_this_week',(SELECT count(*) FROM study_session WHERE profile_id=p_profile_id AND type='focus' AND started_at>=now()-interval '7 days'),
      'total_pomodoros',(SELECT count(*) FROM study_session WHERE profile_id=p_profile_id AND type IN('focus','pomodoro') AND status='completed')),
    'error_summary',jsonb_build_object(
      'total_errors',(SELECT count(*) FROM error_log WHERE profile_id=p_profile_id),
      'unconfirmed_errors',(SELECT count(*) FROM error_log WHERE profile_id=p_profile_id AND NOT confirmed),
      'recent_recurrences',(SELECT count(*) FROM error_log WHERE profile_id=p_profile_id AND recurrence_count>1 AND last_occurrence>=now()-interval '7 days'),
      'by_cause',COALESCE((SELECT jsonb_agg(jsonb_build_object('cause',cause,'count',n)) FROM(SELECT cause,count(*)n FROM error_log WHERE profile_id=p_profile_id GROUP BY cause)s),'[]'::jsonb)),
    'mastery_overview',COALESCE((SELECT jsonb_agg(jsonb_build_object('topic_id',a.id,'topic_name',a.topic,'subject_name',a.subject,'mastery_level',a.mastery,'evidence_count',a.source_question_count) ORDER BY a.mastery) FROM(SELECT * FROM atlas_node WHERE profile_id=p_profile_id ORDER BY mastery LIMIT 10)a),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION dashboard_data(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION dashboard_data(uuid) TO authenticated,service_role;


-- ============================================================
-- TRIGGERS DE SINCRONIZAÇÃO SEARCH_INDEX
-- ============================================================

CREATE OR REPLACE FUNCTION sync_search_index()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE data jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM search_index WHERE entity_type = TG_TABLE_NAME AND entity_id = OLD.id;
    RETURN OLD;
  END IF;
  data := to_jsonb(NEW);
  INSERT INTO search_index(profile_id,entity_type,entity_id,title,content,source_type)
  VALUES(NEW.profile_id,TG_TABLE_NAME,NEW.id,
    COALESCE(data->>'title',data->>'name',data->>'front',left(data->>'stem',120),''),
    COALESCE(data->>'content',data->>'back',data->>'stem',data->>'description',''),'auto')
  ON CONFLICT(entity_type,entity_id) DO UPDATE SET title=EXCLUDED.title,content=EXCLUDED.content;
  RETURN NEW;
END;
$$;

-- Document
CREATE TRIGGER trg_document_search AFTER INSERT OR UPDATE OR DELETE ON document
  FOR EACH ROW EXECUTE FUNCTION sync_search_index();
-- Flashcard
CREATE TRIGGER trg_flashcard_search AFTER INSERT OR UPDATE OR DELETE ON flashcard
  FOR EACH ROW EXECUTE FUNCTION sync_search_index();
-- Question
CREATE TRIGGER trg_question_search AFTER INSERT OR UPDATE OR DELETE ON question
  FOR EACH ROW EXECUTE FUNCTION sync_search_index();
-- Commitment
CREATE TRIGGER trg_commitment_search AFTER INSERT OR UPDATE OR DELETE ON commitment
  FOR EACH ROW EXECUTE FUNCTION sync_search_index();
-- Note (se existir tabela notes no futuro)

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================
CREATE VIEW v_profile_summary WITH (security_invoker = true) AS
SELECT sp.id, sp.user_id, sp.name, sp.goal_type,
       (SELECT COUNT(*) FROM document WHERE profile_id = sp.id) as doc_count,
       (SELECT COUNT(*) FROM flashcard_deck WHERE profile_id = sp.id) as deck_count,
       (SELECT COUNT(*) FROM flashcard WHERE profile_id = sp.id) as card_count,
       (SELECT COUNT(*) FROM question WHERE profile_id = sp.id) as question_count,
       (SELECT MAX(next_review) FROM flashcard WHERE profile_id = sp.id) as next_review_due,
       sp.created_at, sp.updated_at
FROM study_profile sp;

-- ============================================================
-- GRANTS (service_role já tem acesso total; anon via RLS)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_data(uuid) TO authenticated;
