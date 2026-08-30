-- DataMind AI Phase 1: Minimal Database Foundation
-- This migration prepares the schema for future phases without creating unnecessary tables.

-- Enable UUID extension (commonly needed for Supabase/PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Actual tables will be created in later phases:
--   users
--   datasets
--   analysis_runs
--   models
--   predictions
--   ai_insights

-- Future columns and patterns to consider:
--   - users: id, email, created_at, updated_at
--   - datasets: id, user_id, name, file_path, metadata, created_at, updated_at
--   - analysis_runs: id, dataset_id, config, status, results, created_at
--   - models: id, analysis_run_id, type, parameters, metrics, created_at
--   - predictions: id, model_id, input_data, output_data, created_at
--   - ai_insights: id, prediction_id, explanation, confidence, created_at

COMMENT ON SCHEMA public IS 'DataMind AI database schema';
