-- DataMind AI Phase 4: AI Intelligence Layer Schema
-- Extends existing schema with AI analysis tracking

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ml_experiments(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  model TEXT NOT NULL,
  input_context JSONB NOT NULL,
  output JSONB NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'SUCCESS',
  error_message TEXT,
  latency_ms INTEGER,
  token_usage JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]',
  explanation TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tools_used JSONB NOT NULL DEFAULT '[]',
  evidence JSONB NOT NULL DEFAULT '[]',
  limitations JSONB NOT NULL DEFAULT '[]',
  execution_status TEXT NOT NULL DEFAULT 'SUCCESS',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_dataset_id ON ai_analyses(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_experiment_id ON ai_analyses(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_analysis_id ON ai_insights(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_dataset_id ON ai_queries(dataset_id);
