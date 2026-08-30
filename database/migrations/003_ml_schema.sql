-- DataMind AI Phase 3: Machine Learning Schema
-- Extends existing schema with ML experiment tracking

CREATE TABLE IF NOT EXISTS ml_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  problem_type TEXT,
  target_column TEXT NOT NULL,
  selected_features JSONB,
  preprocessing_config JSONB,
  train_test_split JSONB NOT NULL DEFAULT '{"train_size":0.8,"test_size":0.2,"random_seed":42}',
  primary_metric TEXT,
  best_model_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  metrics JSONB,
  feature_importance JSONB,
  preprocessing_version TEXT NOT NULL DEFAULT 'v1',
  random_seed INTEGER NOT NULL,
  training_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'TRAINED'
);

CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES ml_experiments(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  input_data JSONB NOT NULL,
  prediction JSONB NOT NULL,
  probability JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ml_experiments_dataset_id ON ml_experiments(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_status ON ml_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ml_models_experiment_id ON ml_models(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_experiment_id ON ml_predictions(experiment_id);
