-- Preferências utilizadas pelo onboarding e pela interface web.
ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS telemetry_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS telemetry_categories jsonb NOT NULL DEFAULT '{"usage":false,"performance":false,"errors":false,"ai_usage":false}'::jsonb;
ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS backup_interval_hours int NOT NULL DEFAULT 24;
ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Vínculos entre entidades devem pertencer ao mesmo perfil, inclusive via service_role.
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM(VALUES
    ('atlas_node'),('flashcard_deck'),('lia_conversation'),('project'),('exam'),('question'),('document')
  ) AS parents(name) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname=item.name||'_id_profile_unique') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE(id,profile_id)',item.name,item.name||'_id_profile_unique');
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM(VALUES
    ('atlas_edge','from_node','atlas_node'),('atlas_edge','to_node','atlas_node'),
    ('flashcard','deck_id','flashcard_deck'),('lia_message','conversation_id','lia_conversation'),
    ('project_task','project_id','project'),('exam_attempt','exam_id','exam'),
    ('question_attempt','question_id','question'),('document_chunk','document_id','document')
  ) AS links(child,column_name,parent) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname=item.child||'_'||item.column_name||'_profile_fk') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY(%I,profile_id) REFERENCES %I(id,profile_id) ON DELETE CASCADE',item.child,item.child||'_'||item.column_name||'_profile_fk',item.column_name,item.parent);
    END IF;
  END LOOP;
END $$;
