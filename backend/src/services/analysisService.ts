import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { getEnv } from '../config/env.js';
import {
  AnalysisSession,
  DatasetOverview,
  ColumnExploration,
  DescriptiveStatistics,
  DistributionAnalysis,
  DistributionBin,
  CorrelationResult,
  CorrelationMatrix,
  OutlierAnalysis,
  MissingDataAnalysis,
  MissingColumnAnalysis,
  GroupByResult,
  GroupByRow,
  TimeSeriesResult,
  TimeSeriesRow,
  ChartConfiguration,
  ChartResult,
  ChartDataPoint,
  StatisticalTestResult,
} from '../types/analysis.js';
import { DatasetService, AnalysisResult } from './datasetService.js';

interface DatasetRow {
  file_path?: string;
  id: string;
}

interface DatasetFileRow {
  [key: string]: string | number | null;
}

export class AnalysisService {
  static async createSession(datasetId: string, userId?: string, title?: string): Promise<AnalysisSession> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('analysis_sessions')
      .insert({
        dataset_id: datasetId,
        user_id: userId || null,
        title: title || 'Untitled Analysis',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create analysis session: ${error.message}`);
    }
    return data as AnalysisSession;
  }

  static async getSessions(userId?: string): Promise<AnalysisSession[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('analysis_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch analysis sessions: ${error.message}`);
    }
    return (data || []) as AnalysisSession[];
  }

  static async getSession(sessionId: string): Promise<AnalysisSession | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch analysis session: ${error.message}`);
    }
    return data as AnalysisSession;
  }

  static async updateSession(sessionId: string, updates: Partial<AnalysisSession>): Promise<AnalysisSession> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('analysis_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update analysis session: ${error.message}`);
    }
    return data as AnalysisSession;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('analysis_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to delete analysis session: ${error.message}`);
    }
  }

  static async duplicateSession(sessionId: string, userId?: string): Promise<AnalysisSession> {
    const original = await this.getSession(sessionId);
    if (!original) {
      throw new Error('Analysis session not found');
    }

    return this.createSession(
      original.dataset_id,
      userId,
      `${original.title} (Copy)`
    );
  }

  static async getDatasetOverview(datasetId: string): Promise<DatasetOverview> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const { profile } = analysisResult;
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const dateColumns: string[] = [];

    for (const col of profile.columns_detail) {
      if (col.detected_type === 'numeric') {
        numericColumns.push(col.column);
      } else if (col.detected_type === 'datetime') {
        dateColumns.push(col.column);
      } else {
        categoricalColumns.push(col.column);
      }
    }

    return {
      dataset_id: datasetId,
      name: '',
      row_count: profile.rows,
      column_count: profile.columns,
      numeric_columns: numericColumns,
      categorical_columns: categoricalColumns,
      date_columns: dateColumns,
      missing_values: profile.missing_values,
      duplicate_rows: profile.duplicate_rows,
      quality_score: profile.quality_score,
    };
  }

  static async exploreColumn(datasetId: string, columnName: string): Promise<ColumnExploration> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const columnDetail = analysisResult.profile.columns_detail.find(
      (c) => c.column === columnName
    );
    if (!columnDetail) {
      throw new Error(`Column '${columnName}' not found`);
    }

    const exploration: ColumnExploration = {
      column: columnName,
      dtype: columnDetail.dtype,
      detected_type: columnDetail.detected_type,
      missing: columnDetail.missing,
      missing_percentage: columnDetail.missing_percentage,
      unique_values: columnDetail.unique_values,
    };

    if (columnDetail.detected_type === 'numeric' && analysisResult.statistics[columnName]) {
      const stats = analysisResult.statistics[columnName];
      exploration.numeric_stats = {
        count: stats.count,
        mean: stats.mean ?? null,
        median: stats.median ?? null,
        std: stats.std ?? null,
        min: stats.min ?? null,
        max: stats.max ?? null,
        q1: stats.q1 ?? null,
        q3: stats.q3 ?? null,
        iqr: stats.q1 != null && stats.q3 != null ? stats.q3 - stats.q1 : null,
        skewness: null,
        kurtosis: null,
      };
    }

    if ((columnDetail.detected_type === 'categorical' || columnDetail.detected_type === 'boolean') && analysisResult.statistics[columnName]) {
      const stats = analysisResult.statistics[columnName];
      exploration.categorical_stats = {
        count: stats.count,
        unique_count: stats.unique_count ?? 0,
        most_frequent: stats.most_frequent ?? null,
        most_frequent_count: stats.most_frequent_count ?? 0,
        categories: [],
      };
    }

    return exploration;
  }

  static async getDescriptiveStatistics(datasetId: string, columnName: string): Promise<DescriptiveStatistics> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const stats = analysisResult.statistics[columnName];
    if (!stats || stats.type !== 'numeric') {
      throw new Error(`No numeric statistics available for column '${columnName}'`);
    }

    return {
      column: columnName,
      count: stats.count,
      mean: stats.mean ?? null,
      median: stats.median ?? null,
      std: stats.std ?? null,
      min: stats.min ?? null,
      max: stats.max ?? null,
      q1: stats.q1 ?? null,
      q3: stats.q3 ?? null,
      iqr: stats.q1 != null && stats.q3 != null ? stats.q3 - stats.q1 : null,
      skewness: null,
      kurtosis: null,
    };
  }

  static async getDistributionAnalysis(datasetId: string, columnName: string, bins?: number): Promise<DistributionAnalysis> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const stats = analysisResult.statistics[columnName];
    if (!stats || stats.mean == null) {
      throw new Error(`No numeric data available for column '${columnName}'`);
    }

    const numBins = bins || 10;
    const min = stats.min ?? 0;
    const max = stats.max ?? 0;
    const binWidth = (max - min) / numBins;

    const distributionBins: DistributionBin[] = [];
    for (let i = 0; i < numBins; i++) {
      const start = min + i * binWidth;
      const end = start + binWidth;
      distributionBins.push({
        start,
        end,
        count: 0,
        frequency: 0,
      });
    }

    const outlierInfo = analysisResult.outliers[columnName];

    return {
      column: columnName,
      bins: distributionBins,
      statistics: {
        mean: stats.mean,
        median: stats.median ?? stats.mean,
        std: stats.std ?? 0,
        iqr: stats.q1 != null && stats.q3 != null ? stats.q3 - stats.q1 : 0,
        min,
        max,
      },
      outliers: {
        count: outlierInfo?.outlier_count ?? 0,
        percentage: outlierInfo?.outlier_percentage ?? 0,
        lower_bound: outlierInfo?.lower_bound ?? min,
        upper_bound: outlierInfo?.upper_bound ?? max,
        method: outlierInfo?.method ?? 'IQR',
      },
    };
  }

  static async getCorrelation(datasetId: string, columnA: string, columnB: string, method: 'pearson' | 'spearman' = 'pearson'): Promise<CorrelationResult> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const correlation = analysisResult.correlations.matrix[columnA]?.[columnB];
    if (correlation === undefined) {
      throw new Error(`Correlation not available for '${columnA}' and '${columnB}'`);
    }

    const relationship = this.interpretCorrelation(correlation);

    return {
      column_a: columnA,
      column_b: columnB,
      method,
      coefficient: correlation,
      sample_size: analysisResult.profile.rows,
      relationship,
    };
  }

  static async getCorrelationMatrix(datasetId: string, method: 'pearson' | 'spearman' = 'pearson'): Promise<CorrelationMatrix> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const numericColumns = analysisResult.profile.columns_detail
      .filter((c) => c.detected_type === 'numeric')
      .map((c) => c.column);

    const matrix: (number | null)[][] = numericColumns.map((colA) =>
      numericColumns.map((colB) => {
        if (colA === colB) return 1;
        return analysisResult.correlations.matrix[colA]?.[colB] ?? null;
      })
    );

    return {
      columns: numericColumns,
      matrix,
      method,
    };
  }

  static async analyzeOutliers(datasetId: string, columnName: string, method: 'IQR' | 'ZSCORE' = 'IQR'): Promise<OutlierAnalysis> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const outlierInfo = analysisResult.outliers[columnName];
    if (!outlierInfo) {
      throw new Error(`No outlier analysis available for column '${columnName}'`);
    }

    return {
      column: columnName,
      method,
      threshold: method === 'IQR' ? 1.5 : 3,
      total_count: analysisResult.profile.rows,
      outlier_count: outlierInfo.outlier_count,
      outlier_percentage: outlierInfo.outlier_percentage,
      lower_bound: outlierInfo.lower_bound ?? 0,
      upper_bound: outlierInfo.upper_bound ?? 0,
      note: outlierInfo.note ?? 'Potential outliers detected. These are not automatically errors.',
    };
  }

  static async analyzeMissingData(datasetId: string): Promise<MissingDataAnalysis> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    const columns: MissingColumnAnalysis[] = analysisResult.missing_values.columns.map((col) => ({
      column: col.column,
      missing_count: col.missing_count,
      missing_percentage: col.missing_percentage,
      category: col.category as MissingColumnAnalysis['category'],
    }));

    return {
      total_missing: analysisResult.missing_values.total_missing,
      total_percentage: analysisResult.missing_values.total_percentage,
      columns,
    };
  }

  static async groupByAnalysis(datasetId: string, groupBy: string, measure: string, aggregation: string): Promise<GroupByResult> {
    const dataset = await DatasetService.getDatasetById(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const filePath = (dataset as unknown as DatasetRow).file_path;
    if (!filePath) {
      throw new Error('Dataset file not available');
    }

    const rows = await this.readDatasetRows(filePath);
    const grouped = this.computeGroupBy(rows, groupBy, measure, aggregation);

    return {
      group_by: groupBy,
      measure,
      aggregation,
      rows: grouped,
    };
  }

  static async timeSeriesAnalysis(datasetId: string, dateColumn: string, valueColumn: string, frequency: string, aggregation: string): Promise<TimeSeriesResult> {
    const dataset = await DatasetService.getDatasetById(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const filePath = (dataset as unknown as DatasetRow).file_path;
    if (!filePath) {
      throw new Error('Dataset file not available');
    }

    const rows = await this.readDatasetRows(filePath);
    const timeSeries = this.computeTimeSeries(rows, dateColumn, valueColumn, frequency, aggregation);

    return {
      date_column: dateColumn,
      value_column: valueColumn,
      frequency,
      aggregation,
      rows: timeSeries,
    };
  }

  static async generateChart(datasetId: string, config: ChartConfiguration): Promise<ChartResult> {
    const dataset = await DatasetService.getDatasetById(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const filePath = (dataset as unknown as DatasetRow).file_path;
    if (!filePath) {
      throw new Error('Dataset file not available');
    }

    const rows = await this.readDatasetRows(filePath);
    const data = this.computeChartData(rows, config);

    return {
      chart_type: config.chart_type,
      configuration: config,
      data,
      metadata: {
        sample_size: rows.length,
        is_sampled: false,
        total_rows: rows.length,
      },
    };
  }

  static async runStatisticalTest(datasetId: string, testType: string, columnA: string, columnB?: string): Promise<StatisticalTestResult> {
    const analysisResult = await this.getAnalysisResult(datasetId);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    switch (testType) {
      case 'ttest':
        return this.runTTest(analysisResult, columnA, columnB);
      case 'chisquare':
        return this.runChiSquare(analysisResult, columnA, columnB);
      case 'anova':
        return this.runAnova(analysisResult, columnA, columnB);
      default:
        throw new Error(`Unsupported statistical test: ${testType}`);
    }
  }

  static async exportAnalysis(sessionId: string, format: string): Promise<unknown> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Analysis session not found');
    }

    const analysisResult = await this.getAnalysisResult(session.dataset_id);
    if (!analysisResult) {
      throw new Error('Dataset analysis not found');
    }

    if (format === 'json') {
      return {
        session: {
          id: session.id,
          title: session.title,
          created_at: session.created_at,
          updated_at: session.updated_at,
        },
        statistics: analysisResult.statistics,
        correlations: analysisResult.correlations,
        outliers: analysisResult.outliers,
        missing_values: analysisResult.missing_values,
      };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  private static async getAnalysisResult(datasetId: string): Promise<AnalysisResult | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('dataset_id', datasetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch analysis result: ${error.message}`);
    }
    return data as unknown as AnalysisResult;
  }

  private static interpretCorrelation(r: number): string {
    const absR = Math.abs(r);
    if (absR >= 0.9) return r > 0 ? 'Very strong positive' : 'Very strong negative';
    if (absR >= 0.7) return r > 0 ? 'Strong positive' : 'Strong negative';
    if (absR >= 0.5) return r > 0 ? 'Moderate positive' : 'Moderate negative';
    if (absR >= 0.3) return r > 0 ? 'Weak positive' : 'Weak negative';
    return 'Very weak or no linear';
  }

  private static async readDatasetRows(filePath: string): Promise<DatasetFileRow[]> {
    const fs = await import('fs');
    const path = await import('path');

    const env = getEnv();
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(env.UPLOAD_DIR, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('Dataset file not found');
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return this.parseCSV(content);
  }

  private static parseCSV(content: string): DatasetFileRow[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: DatasetFileRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: DatasetFileRow = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (value === '' || value === null || value === undefined) {
          row[header] = null;
        } else {
          const num = Number(value);
          row[header] = isNaN(num) ? value : num;
        }
      });
      rows.push(row);
    }

    return rows;
  }

  private static computeGroupBy(rows: DatasetFileRow[], groupBy: string, measure: string, aggregation: string): GroupByRow[] {
    const groups = new Map<string, number[]>();

    for (const row of rows) {
      const groupValue = String(row[groupBy] ?? 'Unknown');
      const measureValue = Number(row[measure]);

      if (isNaN(measureValue)) continue;

      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(measureValue);
    }

    const result: GroupByRow[] = [];
    for (const [groupValue, values] of groups) {
      let computedResult: number;

      switch (aggregation) {
        case 'SUM':
          computedResult = values.reduce((a, b) => a + b, 0);
          break;
        case 'AVG':
          computedResult = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'MIN':
          computedResult = Math.min(...values);
          break;
        case 'MAX':
          computedResult = Math.max(...values);
          break;
        case 'COUNT':
        default:
          computedResult = values.length;
      }

      result.push({
        group_value: groupValue,
        result: computedResult,
        count: values.length,
      });
    }

    return result.sort((a, b) => b.result - a.result);
  }

  private static computeTimeSeries(rows: DatasetFileRow[], dateColumn: string, valueColumn: string, frequency: string, aggregation: string): TimeSeriesRow[] {
    const groups = new Map<string, number[]>();

    for (const row of rows) {
      const dateValue = row[dateColumn];
      const measureValue = Number(row[valueColumn]);

      if (dateValue == null || isNaN(measureValue)) continue;

      const date = new Date(String(dateValue));
      if (isNaN(date.getTime())) continue;

      const key = this.formatDateByFrequency(date, frequency);

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(measureValue);
    }

    const result: TimeSeriesRow[] = [];
    for (const [date, values] of groups) {
      let computedValue: number;

      switch (aggregation) {
        case 'SUM':
          computedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'AVG':
          computedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'MIN':
          computedValue = Math.min(...values);
          break;
        case 'MAX':
          computedValue = Math.max(...values);
          break;
        case 'COUNT':
        default:
          computedValue = values.length;
      }

      result.push({
        date,
        value: computedValue,
        count: values.length,
      });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private static formatDateByFrequency(date: Date, frequency: string): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    switch (frequency) {
      case 'daily':
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(day - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      case 'monthly':
        return `${year}-${String(month + 1).padStart(2, '0')}`;
      case 'quarterly':
        const quarter = Math.floor(month / 3) + 1;
        return `${year}-Q${quarter}`;
      case 'yearly':
        return `${year}`;
      default:
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  private static computeChartData(rows: DatasetFileRow[], config: ChartConfiguration): ChartDataPoint[] {
    switch (config.chart_type) {
      case 'bar':
        return this.computeBarChart(rows, config);
      case 'line':
        return this.computeLineChart(rows, config);
      case 'scatter':
        return this.computeScatterChart(rows, config);
      case 'histogram':
        return this.computeHistogram(rows, config);
      default:
        return this.computeBarChart(rows, config);
    }
  }

  private static computeBarChart(rows: DatasetFileRow[], config: ChartConfiguration): ChartDataPoint[] {
    const groups = new Map<string, number[]>();

    for (const row of rows) {
      const label = String(row[config.x_axis] ?? 'Unknown');
      const value = config.y_axis ? Number(row[config.y_axis]) : 1;

      if (config.y_axis && isNaN(value)) continue;

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(value);
    }

    const result: ChartDataPoint[] = [];
    for (const [label, values] of groups) {
      let computedValue: number;
      const aggregation = config.aggregation || 'COUNT';

      switch (aggregation) {
        case 'SUM':
          computedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'AVG':
          computedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'MIN':
          computedValue = Math.min(...values);
          break;
        case 'MAX':
          computedValue = Math.max(...values);
          break;
        case 'COUNT':
        default:
          computedValue = values.length;
      }

      result.push({ label, value: computedValue });
    }

    return result.slice(0, 50).sort((a, b) => b.value - a.value);
  }

  private static computeLineChart(rows: DatasetFileRow[], config: ChartConfiguration): ChartDataPoint[] {
    return this.computeBarChart(rows, config);
  }

  private static computeScatterChart(rows: DatasetFileRow[], config: ChartConfiguration): ChartDataPoint[] {
    const yAxis = config.y_axis || config.x_axis;
    return rows
      .filter((row) => row[config.x_axis] != null && row[yAxis] != null)
      .map((row) => ({
        label: String(row[config.x_axis] ?? ''),
        value: Number(row[yAxis] ?? 0),
        x: Number(row[config.x_axis] ?? 0),
        y: Number(row[yAxis] ?? 0),
      }))
      .filter((point) => !isNaN(point.x!) && !isNaN(point.y!))
      .slice(0, 1000);
  }

  private static computeHistogram(rows: DatasetFileRow[], config: ChartConfiguration): ChartDataPoint[] {
    const values = rows
      .map((row) => Number(row[config.x_axis]))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const numBins = config.bins || 10;
    const binWidth = (max - min) / numBins;

    const bins: ChartDataPoint[] = [];
    for (let i = 0; i < numBins; i++) {
      const start = min + i * binWidth;
      const end = start + binWidth;
      const count = values.filter((v) => v >= start && (i === numBins - 1 ? v <= end : v < end)).length;
      bins.push({
        label: `${start.toFixed(1)}-${end.toFixed(1)}`,
        value: count,
      });
    }

    return bins;
  }

  private static runTTest(analysisResult: AnalysisResult, columnA: string, columnB?: string): StatisticalTestResult {
    const statsA = analysisResult.statistics[columnA];
    const statsB = columnB ? analysisResult.statistics[columnB] : null;

    if (!statsA || statsA.mean == null) {
      throw new Error(`Insufficient data for t-test on column '${columnA}'`);
    }

    return {
      test_type: 'ttest',
      null_hypothesis: `The mean of ${columnA} is equal to ${columnB ? `the mean of ${columnB}` : 'zero'}`,
      alternative_hypothesis: `The mean of ${columnA} is ${columnB ? 'different from' : 'different from'} ${columnB ? `the mean of ${columnB}` : 'zero'}`,
      test_statistic: null,
      p_value: null,
      sample_size: statsA.count,
      assumptions: [
        'Observations are independent',
        'Data is approximately normally distributed',
        'Variances are equal (for two-sample t-test)',
      ],
      limitations: [
        'This is a simplified calculation. For rigorous analysis, use dedicated statistical software.',
        'P-value calculation requires the full distribution.',
      ],
      interpretation: `Column '${columnA}' has mean ${statsA.mean?.toFixed(4)}${statsB ? ` and column '${columnB}' has mean ${statsB.mean?.toFixed(4)}` : ''}. A full t-test requires computing the test statistic from the complete data distribution.`,
    };
  }

  private static runChiSquare(analysisResult: AnalysisResult, columnA: string, columnB?: string): StatisticalTestResult {
    if (!columnB) {
      throw new Error('Chi-square test requires two columns');
    }

    return {
      test_type: 'chisquare',
      null_hypothesis: `${columnA} and ${columnB} are independent`,
      alternative_hypothesis: `${columnA} and ${columnB} are not independent`,
      test_statistic: null,
      p_value: null,
      sample_size: analysisResult.profile.rows,
      assumptions: [
        'Observations are independent',
        'Expected frequencies are at least 5 in each cell',
      ],
      limitations: [
        'Chi-square test requires contingency table computation.',
        'This is a simplified result. For rigorous analysis, use dedicated statistical software.',
      ],
      interpretation: `A full chi-square test requires computing the contingency table and expected frequencies for '${columnA}' and '${columnB}'.`,
    };
  }

  private static runAnova(analysisResult: AnalysisResult, columnA: string, columnB?: string): StatisticalTestResult {
    return {
      test_type: 'anova',
      null_hypothesis: `The means of ${columnA} are equal across all groups defined by ${columnB}`,
      alternative_hypothesis: `At least one group mean of ${columnA} is different`,
      test_statistic: null,
      p_value: null,
      sample_size: analysisResult.profile.rows,
      assumptions: [
        'Observations are independent',
        'Data within each group is approximately normally distributed',
        'Homogeneity of variances across groups',
      ],
      limitations: [
        'ANOVA requires computing between-group and within-group variance.',
        'This is a simplified result. For rigorous analysis, use dedicated statistical software.',
      ],
      interpretation: `A full ANOVA requires computing the F-statistic from group means and variances for '${columnA}' grouped by '${columnB}'.`,
    };
  }
}
