export interface AnalysisSession {
  id: string;
  dataset_id: string;
  user_id?: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SavedVisualization {
  id: string;
  analysis_id: string;
  user_id?: string;
  title: string;
  description?: string;
  visualization_type: string;
  configuration: Record<string, unknown>;
  result_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AnalysisNote {
  id: string;
  analysis_id: string;
  user_id?: string;
  content: string;
  note_type: 'USER' | 'AI';
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisInsight {
  id: string;
  analysis_id: string;
  user_id?: string;
  insight_type: string;
  title: string;
  content: string;
  evidence: Record<string, unknown>;
  confidence?: 'low' | 'medium' | 'high';
  severity?: 'info' | 'warning' | 'critical';
  created_at: string;
}

export interface DatasetOverview {
  dataset_id: string;
  name: string;
  row_count: number;
  column_count: number;
  numeric_columns: string[];
  categorical_columns: string[];
  date_columns: string[];
  missing_values: number;
  duplicate_rows: number;
  quality_score: number | null;
}

export interface ColumnExploration {
  column: string;
  dtype: string;
  detected_type: string;
  missing: number;
  missing_percentage: number;
  unique_values: number;
  numeric_stats?: NumericColumnStats;
  categorical_stats?: CategoricalColumnStats;
  date_stats?: DateColumnStats;
}

export interface NumericColumnStats {
  count: number;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  skewness: number | null;
  kurtosis: number | null;
}

export interface CategoricalColumnStats {
  count: number;
  unique_count: number;
  most_frequent: string | null;
  most_frequent_count: number;
  categories: CategoryFrequency[];
}

export interface CategoryFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface DateColumnStats {
  min_date: string | null;
  max_date: string | null;
  range_days: number | null;
}

export interface DescriptiveStatistics {
  column: string;
  count: number;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  skewness: number | null;
  kurtosis: number | null;
}

export interface DistributionAnalysis {
  column: string;
  bins: DistributionBin[];
  statistics: {
    mean: number;
    median: number;
    std: number;
    iqr: number;
    min: number;
    max: number;
  };
  outliers: {
    count: number;
    percentage: number;
    lower_bound: number;
    upper_bound: number;
    method: string;
  };
}

export interface DistributionBin {
  start: number;
  end: number;
  count: number;
  frequency: number;
}

export interface CorrelationRequest {
  column_a: string;
  column_b: string;
  method: 'pearson' | 'spearman';
}

export interface CorrelationResult {
  column_a: string;
  column_b: string;
  method: string;
  coefficient: number | null;
  sample_size: number | null;
  relationship: string;
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: (number | null)[][];
  method: string;
}

export interface OutlierAnalysis {
  column: string;
  method: 'IQR' | 'ZSCORE';
  threshold: number;
  total_count: number;
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number;
  upper_bound: number;
  note: string;
}

export interface MissingDataAnalysis {
  total_missing: number;
  total_percentage: number;
  columns: MissingColumnAnalysis[];
}

export interface MissingColumnAnalysis {
  column: string;
  missing_count: number;
  missing_percentage: number;
  category: 'complete' | 'low_missingness' | 'moderate_missingness' | 'high_missingness';
}

export interface GroupByRequest {
  group_by: string;
  measure: string;
  aggregation: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  filters?: AnalysisFilter[];
}

export interface AnalysisFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: unknown;
}

export interface GroupByResult {
  group_by: string;
  measure: string;
  aggregation: string;
  rows: GroupByRow[];
}

export interface GroupByRow {
  group_value: string;
  result: number;
  count: number;
}

export interface TimeSeriesRequest {
  date_column: string;
  value_column: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
}

export interface TimeSeriesResult {
  date_column: string;
  value_column: string;
  frequency: string;
  aggregation: string;
  rows: TimeSeriesRow[];
}

export interface TimeSeriesRow {
  date: string;
  value: number;
  count: number;
}

export interface ChartConfiguration {
  chart_type: 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'area';
  x_axis: string;
  y_axis?: string;
  group_by?: string;
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  filters?: AnalysisFilter[];
  bins?: number;
}

export interface ChartResult {
  chart_type: string;
  configuration: ChartConfiguration;
  data: ChartDataPoint[];
  metadata: {
    sample_size: number;
    is_sampled: boolean;
    total_rows?: number;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  group?: string;
  x?: number;
  y?: number;
}

export interface ExportConfiguration {
  format: 'csv' | 'json';
  include_statistics: boolean;
  include_charts: boolean;
  include_notes: boolean;
  include_ai_insights: boolean;
}

export interface StatisticalTestRequest {
  test_type: 'ttest' | 'chisquare' | 'anova';
  column_a: string;
  column_b?: string;
  group_column?: string;
  value_column?: string;
}

export interface StatisticalTestResult {
  test_type: string;
  null_hypothesis: string;
  alternative_hypothesis: string;
  test_statistic: number | null;
  p_value: number | null;
  sample_size: number;
  assumptions: string[];
  limitations: string[];
  interpretation: string;
}

export interface AIAnalysisRequest {
  analysis_type: string;
  context: Record<string, unknown>;
  question?: string;
}

export interface AIAnalysisResponse {
  observed_result: string;
  interpretation: string;
  hypothesis?: string;
  limitations: string;
  suggested_next_steps?: string[];
}
