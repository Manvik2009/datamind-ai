export interface DatasetSummaryContext {
  dataset: {
    name: string;
    rows: number;
    columns: number;
    memory_bytes: number;
    duplicate_rows: number;
    duplicate_percentage: number;
    missing_values: number;
    missing_percentage: number;
    columns_detail: Array<{
      column: string;
      dtype: string;
      detected_type: string;
      missing: number;
      missing_percentage: number;
      unique_values: number;
      sample_values: unknown[];
    }>;
    quality_score: number;
    quality_breakdown: {
      missing_values: number;
      duplicates: number;
      data_types: number;
      overall: number;
    };
  };
  statistics?: Record<string, any>;
  missing_values?: {
    total_missing: number;
    total_percentage: number;
    columns: Array<{
      column: string;
      missing_count: number;
      missing_percentage: number;
      category: string;
    }>;
  };
  duplicates?: {
    duplicate_rows: number;
    duplicate_percentage: number;
    has_duplicates: boolean;
  };
  outliers?: Record<string, any>;
  correlations?: {
    matrix: Record<string, Record<string, number>>;
    relationships: Array<{
      column_a: string;
      column_b: string;
      correlation: number;
      relationship: string;
    }>;
  };
}

export interface MLExplanationContext {
  problem_type: string;
  target_column: string;
  best_model: {
    model_type: string;
    metrics: Record<string, unknown>;
    feature_importance?: Record<string, number>;
  };
  comparison: Array<{
    model_type: string;
    metrics: Record<string, unknown>;
    training_time_ms: number;
  }>;
  class_distribution?: Record<string, string>;
}

export interface AIInsight {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  evidence: string[];
  explanation: string;
  recommendation: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AIQueryResponse {
  answer: string;
  insights: AIInsight[];
  evidence: string[];
  limitations: string[];
  tools_used: string[];
}

export interface DecisionExplanationContext {
  prediction?: {
    value: unknown;
    target_column?: string;
  };
  probability?: Record<string, number>;
  feature_contributions?: Record<string, number>;
  input_data?: Record<string, unknown>;
}

export interface DecisionAnalysisContext {
  dataset_id: string;
  experiment_id: string;
  question: string;
  evidence: Record<string, unknown>;
  model_performance: Record<string, unknown>;
  feature_importance: Record<string, number>;
}
