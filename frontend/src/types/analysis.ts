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
  method: string;
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
