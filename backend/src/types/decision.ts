export interface DecisionPrediction {
  id: string;
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  input_data: Record<string, unknown>;
  prediction: Record<string, unknown>;
  probability?: Record<string, unknown>;
  feature_contributions?: Record<string, number>;
  explanation?: string;
  created_at: string;
}

export interface DecisionScenario {
  id: string;
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  scenario_name?: string;
  baseline_input: Record<string, unknown>;
  scenario_input: Record<string, unknown>;
  baseline_prediction: Record<string, unknown>;
  scenario_prediction: Record<string, unknown>;
  difference: Record<string, unknown>;
  created_at: string;
}

export interface DecisionScenarioComparison {
  id: string;
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  scenario_ids: string[];
  comparison_results: Record<string, unknown>;
  created_at: string;
}

export interface DecisionSensitivityAnalysis {
  id: string;
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  feature_name: string;
  values: unknown[];
  predictions: unknown[];
  created_at: string;
}

export interface DecisionRecommendation {
  id: string;
  dataset_id: string;
  experiment_id: string;
  title: string;
  description: string;
  evidence: unknown[];
  impact_area: string;
  confidence: 'low' | 'medium' | 'high';
  limitations: unknown[];
  created_at: string;
}

export interface DecisionReport {
  id: string;
  dataset_id: string;
  experiment_id: string;
  report_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface DecisionHistoryItem {
  id: string;
  dataset_id: string;
  experiment_id?: string;
  action_type: string;
  reference_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DecisionFactors {
  factors: Array<{
    factor: string;
    importance: number;
    direction: string;
    evidence_source: string;
  }>;
}

export interface DecisionJob {
  id: string;
  job_type: 'batch_prediction' | 'sensitivity_analysis' | 'report';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  dataset_id: string;
  experiment_id?: string;
  model_id?: string;
  input_data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface PredictionInput {
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  input_data: Record<string, unknown>;
}

export interface BatchPredictionInput {
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  records: Record<string, unknown>[];
}

export interface ScenarioInput {
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  baseline_input: Record<string, unknown>;
  scenario_input: Record<string, unknown>;
  scenario_name?: string;
}

export interface SensitivityInput {
  dataset_id: string;
  experiment_id: string;
  model_id: string;
  feature_name: string;
  base_input: Record<string, unknown>;
  values: unknown[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BatchPredictionResult {
  total: number;
  successful: number;
  failed: number;
  predictions: Array<{
    index: number;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
  }>;
}
