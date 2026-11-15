-- ============================================================
-- 004_modules_v2.sql — tabelas dos módulos Exams, Atlas, Planner,
-- Projects, School, Studio, Lab, Oral, Learn (tarefas).
-- Mesmo padrão do 001: profile_id + RLS por dono do perfil.
-- ============================================================

-- Exams (provas/simulados)
CREATE TABLE exam (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- ordem das questões da prova
  status text NOT NULL DEFAULT 'draft', -- draft | published | archived
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exam_profile ON exam(profile_id);

-- Tentativas de prova (autosave + entrega)
CREATE TABLE exam_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb, -- {question_id: resposta}
  score numeric,          -- calculado no submit (determinístico)
  max_score numeric,
  time_spent_seconds integer,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress | submitted
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempt_exam ON exam_attempt(exam_id);
CREATE INDEX idx_attempt_profile ON exam_attempt(profile_id);

-- Atlas (mapa de conhecimento)
CREATE TABLE atlas_node (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  mastery numeric NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 1), -- 0..1
  last_practiced timestamptz,
  source_question_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, subject, topic)
);
CREATE TABLE atlas_edge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  from_node uuid NOT NULL REFERENCES atlas_node(id) ON DELETE CASCADE,
  to_node uuid NOT NULL REFERENCES atlas_node(id) ON DELETE CASCADE, -- from é pré-requisito de to
  kind text NOT NULL DEFAULT 'prerequisite',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_node, to_node, kind)
);

-- Planner (tarefas além de compromisos)
CREATE TABLE planner_task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'medium', -- low | medium | high
  status text NOT NULL DEFAULT 'todo',     -- todo | in_progress | done
  subject text,
  estimated_minutes integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_profile_status ON planner_task(profile_id, status);

-- Projects
CREATE TABLE project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active', -- active | paused | done
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE project_task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ptask_project ON project_task(project_id);

-- School (disciplinas e notas)
CREATE TABLE school_subject (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  period text, -- ex: "2026.1"
  teacher text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE school_grade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES school_subject(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  label text NOT NULL,          -- ex: "Prova 1", "Trabalho"
  value numeric NOT NULL,       -- nota obtida
  max_value numeric NOT NULL DEFAULT 10,
  weight numeric NOT NULL DEFAULT 1,
  date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_grade_subject ON school_grade(subject_id);

-- Studio (documentos criados: resumos, trabalhos, slides)
CREATE TABLE studio_document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'note', -- note | summary | essay | slides
  content text NOT NULL DEFAULT '',
  "references" jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{document_id?, title, page?}]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lab (experimentos e cálculos)
CREATE TABLE lab_experiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  hypothesis text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{label, expression, value, simulated: boolean}]
  conclusion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Oral (sessões de prática oral)
CREATE TABLE oral_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  topic text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{role: 'user'|'lia', text}]
  evaluation jsonb, -- critérios: {clareza, precisao, completude} 0..1
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS (mesmo padrão do 001)
ALTER TABLE exam ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_edge ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_experiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE oral_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_exam" ON exam FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = exam.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = exam.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_exam_attempt" ON exam_attempt FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = exam_attempt.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = exam_attempt.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_atlas_node" ON atlas_node FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = atlas_node.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = atlas_node.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_atlas_edge" ON atlas_edge FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = atlas_edge.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = atlas_edge.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_planner_task" ON planner_task FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = planner_task.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = planner_task.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_project" ON project FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = project.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = project.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_project_task" ON project_task FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = project_task.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = project_task.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_school_subject" ON school_subject FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = school_subject.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = school_subject.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_school_grade" ON school_grade FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = school_grade.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = school_grade.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_studio_doc" ON studio_document FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = studio_document.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = studio_document.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_lab_exp" ON lab_experiment FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lab_experiment.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lab_experiment.profile_id AND sp.user_id = auth.uid())
);
CREATE POLICY "own_oral" ON oral_session FOR ALL USING (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = oral_session.profile_id AND sp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = oral_session.profile_id AND sp.user_id = auth.uid())
);

-- updated_at automático
CREATE TRIGGER trg_exam_updated BEFORE UPDATE ON exam FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attempt_updated BEFORE UPDATE ON exam_attempt FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_atlas_node_updated BEFORE UPDATE ON atlas_node FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_task_updated BEFORE UPDATE ON planner_task FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_project_updated BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ptask_updated BEFORE UPDATE ON project_task FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subject_updated BEFORE UPDATE ON school_subject FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_grade_updated BEFORE UPDATE ON school_grade FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_studio_updated BEFORE UPDATE ON studio_document FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lab_updated BEFORE UPDATE ON lab_experiment FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_oral_updated BEFORE UPDATE ON oral_session FOR EACH ROW EXECUTE FUNCTION set_updated_at();
