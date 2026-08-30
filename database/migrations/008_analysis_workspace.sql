-- DataMind AI Phase 9: Analysis Workspace
-- Creates tables for analysis sessions, saved visualizations, notes, and insights

CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Analysis',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_sessions_dataset_id ON analysis_sessions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);

CREATE TABLE IF NOT EXISTS saved_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visualization_type TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_visualizations_analysis_id ON saved_visualizations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_user_id ON saved_visualizations(user_id);

CREATE TABLE IF NOT EXISTS analysis_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'USER' CHECK (note_type IN ('USER', 'AI')),
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_notes_analysis_id ON analysis_notes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_notes_user_id ON analysis_notes(user_id);

CREATE TABLE IF NOT EXISTS analysis_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_insights_analysis_id ON analysis_insights(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_insights_user_id ON analysis_insights(user_id);

CREATE OR REPLACE FUNCTION update_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_analysis_sessions_updated_at ON analysis_sessions;
CREATE TRIGGER update_analysis_sessions_updated_at
  BEFORE UPDATE ON analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_updated_at();

DROP TRIGGER IF EXISTS update_saved_visualizations_updated_at ON saved_visualizations;
CREATE TRIGGER update_saved_visualizations_updated_at
  BEFORE UPDATE ON saved_visualizations
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_updated_at();

DROP TRIGGER IF EXISTS update_analysis_notes_updated_at ON analysis_notes;
CREATE TRIGGER update_analysis_notes_updated_at
  BEFORE UPDATE ON analysis_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_updated_at();

ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_sessions_owner_policy ON analysis_sessions
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL OR current_user = 'postgres');

CREATE POLICY saved_visualizations_owner_policy ON saved_visualizations
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL OR current_user = 'postgres');

CREATE POLICY analysis_notes_owner_policy ON analysis_notes
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL OR current_user = 'postgres');

CREATE POLICY analysis_insights_owner_policy ON analysis_insights
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL OR current_user = 'postgres');
