export interface MLExperiment {
  id: string;
  dataset_id: string;
  name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  problem_type?: string;
  target_column: string;
  selected_features?: string[];
  preprocessing_config?: Record<string, unknown>;
  train_test_split: {
    train_size: number;
    test_size: number;
    random_seed: number;
  };
  primary_metric?: string;
  best_model_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface MLModel {
  id: string;
  experiment_id: string;
  model_type: string;
  version: number;
  metrics: Record<string, unknown>;
  feature_importance?: Record<string, number>;
  preprocessing_version: string;
  random_seed: number;
  training_timestamp: string;
  status: string;
}

export interface MLPrediction {
  id: string;
  experiment_id: string;
  model_id: string;
  input_data: Record<string, unknown>;
  prediction: Record<string, unknown>;
  probability?: Record<string, unknown>;
  created_at: string;
}

export interface ExperimentResult {
  experiment_id: string;
  problem_type: string;
  primary_metric: string;
  best_model: {
    model_type: string;
    model_id: string;
    metrics: Record<string, unknown>;
    feature_importance?: Record<string, number>;
  };
  comparison: Array<{
    model_type: string;
    model_id: string;
    status: string;
    metrics: Record<string, unknown>;
    training_time_ms: number;
  }>;
  class_distribution?: Record<string, string>;
}
