-- PRISMA Web — Migração 003: Memória acadêmica da LIA
-- Fatos verificados, resumos de conversas e fontes.

CREATE TABLE IF NOT EXISTS lia_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES study_profile(id) ON DELETE CASCADE,
  kind text NOT NULL, -- "fact", "preference", "goal", "weakness", "source"
  content text NOT NULL,
  confidence real NOT NULL DEFAULT 0.5, -- 0..1, só vira "fato" com >= 0.8
  source text, -- "user", "document:<id>", "inferred"
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lia_memory_profile ON lia_memory(profile_id);
CREATE INDEX idx_lia_memory_kind ON lia_memory(profile_id, kind);

ALTER TABLE lia_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_lia_memory" ON lia_memory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lia_memory.profile_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_profile sp WHERE sp.id = lia_memory.profile_id AND sp.user_id = auth.uid())
  );

CREATE TRIGGER trg_lia_memory_updated BEFORE UPDATE ON lia_memory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON lia_memory TO authenticated;