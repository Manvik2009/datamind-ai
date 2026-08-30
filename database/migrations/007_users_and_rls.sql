-- DataMind AI Phase 7: Users Table and RLS Policies
-- Adds user management and row-level security

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ml_experiments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ml_models ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ml_predictions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ai_analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ai_queries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_predictions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_scenarios ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_scenario_comparisons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_sensitivity_analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_recommendations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decision_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE decision_jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_user_id ON ml_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_user_id ON ml_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_user_id ON ml_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_user_id ON ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_predictions_user_id ON decision_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_scenarios_user_id ON decision_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_jobs_user_id ON decision_jobs(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_scenario_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_sensitivity_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY datasets_owner_policy ON datasets
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY ml_experiments_owner_policy ON ml_experiments
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY ml_models_owner_policy ON ml_models
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY ml_predictions_owner_policy ON ml_predictions
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY ai_analyses_owner_policy ON ai_analyses
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY ai_insights_owner_policy ON ai_insights
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY ai_queries_owner_policy ON ai_queries
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY decision_predictions_owner_policy ON decision_predictions
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY decision_scenarios_owner_policy ON decision_scenarios
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');

CREATE POLICY decision_jobs_owner_policy ON decision_jobs
  FOR ALL USING (user_id = auth.uid() OR current_user = 'postgres');
