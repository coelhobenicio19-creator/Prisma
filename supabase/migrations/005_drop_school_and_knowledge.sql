-- ============================================================
-- 005_drop_school_and_knowledge.sql
-- 1) Remove o módulo School (tabelas dedicadaa) — decisão do usuário.
--    As tabelas podem conter dados; como o módulo foi retirado antes
--    do deploy, estão vazias. DROP seguro com CASCADE p/ índices/policies.
-- 2) Perfil de conhecimento + onboarding (adenho)
-- ============================================================

DROP TABLE IF EXISTS school_grade CASCADE;
DROP TABLE IF EXISTS school_subject CASCADE;

-- Progresso do onboarding acadêmico (salvamento parcial por etapa)
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  step text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, step)
);

-- Perfil de conhecimento do usuário (declarado, nunca tratado como provado)
CREATE TABLE IF NOT EXISTS knowledge_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES study_profile(id) ON DELETE CASCADE,
  identity jsonb NOT NULL DEFAULT '{}'::jsonb,        -- nome, idade, etapa de ensino
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,           -- objetivos atuais/futuros
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,       -- áreas livres (multi-select + custom)
  favorite_subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficult_subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  study_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  routine jsonb NOT NULL DEFAULT '{}'::jsonb,         -- disponibilidade
  lia_preferences jsonb NOT NULL DEFAULT '{}'::jsonb, -- como a LIA deve ensinar
  free_text text NOT NULL DEFAULT '',                 -- "conte ao PRISMA o que você já sabe"
  consent jsonb NOT NULL DEFAULT '{"lia_use": true, "optional_data": false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Entradas de conhecimento: declaradas / demonstradas / inferidas
CREATE TABLE IF NOT EXISTS knowledge_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('declared','demonstrated','inferred')),
  subject text NOT NULL,
  topic text,
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  source text,            -- 'onboarding' | 'exam' | 'question' | 'lia' | 'manual'
  evidence jsonb,         -- ex: {question_id, correct} ou texto
  allow_lia boolean NOT NULL DEFAULT true,  -- usuário controla o que a LIA pode usar
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_kentry_profile ON knowledge_entry(profile_id, kind);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_onboarding" ON onboarding_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = onboarding_progress.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = onboarding_progress.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_kprofile" ON knowledge_profile FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = knowledge_profile.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = knowledge_profile.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_kentry" ON knowledge_entry FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = knowledge_entry.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = knowledge_entry.profile_id AND sp.user_id = auth.uid())
);

CREATE TRIGGER trg_onb_updated BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_kprof_updated BEFORE UPDATE ON knowledge_profile FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_kentry_updated BEFORE UPDATE ON knowledge_entry FOR EACH ROW EXECUTE FUNCTION set_updated_at();
