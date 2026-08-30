import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, DescriptiveStatistics } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface StatisticsViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const StatisticsView = ({ dataset, overview }: StatisticsViewProps) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [statistics, setStatistics] = useState<DescriptiveStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericColumns = overview?.numeric_columns || [];

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns]);

  useEffect(() => {
    if (selectedColumn) {
      loadStatistics(selectedColumn);
    }
  }, [selectedColumn, dataset.id]);

  const loadStatistics = async (column: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getAnalysisStatistics(dataset.id, column);
      setStatistics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  if (numericColumns.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Descriptive Statistics</h3>
          <p className="text-sm text-muted-foreground">Statistical analysis for numeric columns</p>
        </div>
        <p className="text-sm text-muted-foreground">No numeric columns available for statistical analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Descriptive Statistics</h3>
        <p className="text-sm text-muted-foreground">Statistical analysis for numeric columns</p>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Select Column</label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {numericColumns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading message="Calculating statistics..." />}

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {statistics && !loading && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-4">Statistics for: {statistics.column}</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Count</p>
              <p className="text-lg font-semibold text-foreground">{statistics.count.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Mean</p>
              <p className="text-lg font-semibold text-foreground">{statistics.mean?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Median</p>
              <p className="text-lg font-semibold text-foreground">{statistics.median?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Std Deviation</p>
              <p className="text-lg font-semibold text-foreground">{statistics.std?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Minimum</p>
              <p className="text-lg font-semibold text-foreground">{statistics.min?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Maximum</p>
              <p className="text-lg font-semibold text-foreground">{statistics.max?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Q1 (25th percentile)</p>
              <p className="text-lg font-semibold text-foreground">{statistics.q1?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Q3 (75th percentile)</p>
              <p className="text-lg font-semibold text-foreground">{statistics.q3?.toFixed(4) ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">IQR</p>
              <p className="text-lg font-semibold text-foreground">{statistics.iqr?.toFixed(4) ?? 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-400">
              Methodology: Statistics are computed using standard descriptive statistics formulas.
              Quartiles use linear interpolation. IQR = Q3 - Q1.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
