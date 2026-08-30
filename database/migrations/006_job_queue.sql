-- DataMind AI Phase 6: Job Queue for Async Processing
-- Tracks asynchronous jobs for batch predictions, sensitivity analysis, and reports

CREATE TABLE IF NOT EXISTS decision_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ml_experiments(id) ON DELETE SET NULL,
  model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,
  input_data JSONB,
  result JSONB,
  error_message TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_decision_jobs_status ON decision_jobs(status);
CREATE INDEX IF NOT EXISTS idx_decision_jobs_dataset_id ON decision_jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_decision_jobs_experiment_id ON decision_jobs(experiment_id);
CREATE INDEX IF NOT EXISTS idx_decision_jobs_created_at ON decision_jobs(created_at);
