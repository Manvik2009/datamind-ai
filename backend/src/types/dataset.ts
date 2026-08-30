export interface DatasetRecord {
  id: string;
  filename: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  uploaded_at: string;
  updated_at: string;
}

export interface DatasetDetail extends DatasetRecord {
  file_size: number;
  mime_type: string;
  storage_reference?: string;
  profile?: DatasetProfile;
  missing_values?: MissingValueReport;
  duplicates?: DuplicateReport;
  statistics?: StatisticsResult;
  outliers?: OutlierResult;
  correlations?: CorrelationResult;
}

export interface DatasetProfile {
  rows: number;
  columns: number;
  memory_bytes: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  missing_values: number;
  missing_percentage: number;
  columns_detail: ColumnDetail[];
  quality_score: number;
  quality_breakdown: QualityBreakdown;
}

export interface ColumnDetail {
  column: string;
  dtype: string;
  detected_type: string;
  missing: number;
  missing_percentage: number;
  unique_values: number;
  sample_values: any[];
}

export interface QualityBreakdown {
  missing_values: number;
  duplicates: number;
  data_types: number;
  overall: number;
}

export interface MissingValueReport {
  total_missing: number;
  total_percentage: number;
  columns: MissingColumn[];
}

export interface MissingColumn {
  column: string;
  missing_count: number;
  missing_percentage: number;
  category: 'complete' | 'low_missingness' | 'moderate_missingness' | 'high_missingness';
}

export interface DuplicateReport {
  duplicate_rows: number;
  duplicate_percentage: number;
  has_duplicates: boolean;
}

export interface StatisticsResult {
  [column: string]: NumericStats | CategoricalStats | ColumnStats;
}

export interface NumericStats {
  type: 'numeric';
  count: number;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
}

export interface CategoricalStats {
  type: 'categorical' | 'boolean';
  count: number;
  unique_count: number;
  most_frequent: string | null;
  most_frequent_count: number;
}

export interface ColumnStats {
  type: string;
  count: number;
}

export interface OutlierResult {
  [column: string]: OutlierColumn;
}

export interface OutlierColumn {
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number | null;
  upper_bound: number | null;
  method: string;
  note?: string;
}

export interface CorrelationResult {
  matrix: Record<string, Record<string, number>>;
  relationships: CorrelationRelationship[];
}

export interface CorrelationRelationship {
  column_a: string;
  column_b: string;
  correlation: number;
  relationship: string;
}
