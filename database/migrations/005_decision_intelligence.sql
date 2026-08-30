-- DataMind AI Phase 6: Decision Intelligence Schema
-- Extends existing schema with predictions, scenarios, and decision history

CREATE TABLE IF NOT EXISTS decision_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  input_data JSONB NOT NULL,
  prediction JSONB NOT NULL,
  probability JSONB,
  feature_contributions JSONB,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  scenario_name TEXT,
  baseline_input JSONB NOT NULL,
  scenario_input JSONB NOT NULL,
  baseline_prediction JSONB NOT NULL,
  scenario_prediction JSONB NOT NULL,
  difference JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_scenario_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  scenario_ids JSONB NOT NULL,
  comparison_results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_sensitivity_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  values JSONB NOT NULL,
  predictions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB NOT NULL,
  impact_area TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  limitations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'full',
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ml_experiments(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_predictions_dataset_id ON decision_predictions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_decision_predictions_experiment_id ON decision_predictions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_decision_predictions_model_id ON decision_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_decision_scenarios_dataset_id ON decision_scenarios(dataset_id);
CREATE INDEX IF NOT EXISTS idx_decision_scenarios_experiment_id ON decision_scenarios(experiment_id);
CREATE INDEX IF NOT EXISTS idx_decision_recommendations_dataset_id ON decision_recommendations(dataset_id);
CREATE INDEX IF NOT EXISTS idx_decision_recommendations_experiment_id ON decision_recommendations(experiment_id);
CREATE INDEX IF NOT EXISTS idx_decision_reports_dataset_id ON decision_reports(dataset_id);
CREATE INDEX IF NOT EXISTS idx_decision_history_dataset_id ON decision_history(dataset_id);
CREATE INDEX IF NOT EXISTS idx_decision_history_experiment_id ON decision_history(experiment_id);
