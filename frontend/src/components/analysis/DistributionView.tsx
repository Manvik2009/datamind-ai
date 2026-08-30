import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, DistributionAnalysis } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface DistributionViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const DistributionView = ({ dataset, overview }: DistributionViewProps) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [distribution, setDistribution] = useState<DistributionAnalysis | null>(null);
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
      loadDistribution(selectedColumn);
    }
  }, [selectedColumn, dataset.id]);

  const loadDistribution = async (column: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getAnalysisDistribution(dataset.id, column, 20);
      setDistribution(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load distribution');
      setDistribution(null);
    } finally {
      setLoading(false);
    }
  };

  if (numericColumns.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Distribution Analysis</h3>
          <p className="text-sm text-muted-foreground">Visualize the distribution of numeric columns</p>
        </div>
        <p className="text-sm text-muted-foreground">No numeric columns available for distribution analysis.</p>
      </div>
    );
  }

  const maxCount = Math.max(...(distribution?.bins.map((b) => b.count) || [0]));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Distribution Analysis</h3>
        <p className="text-sm text-muted-foreground">Visualize the distribution of numeric columns</p>
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

      {loading && <Loading message="Analyzing distribution..." />}

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {distribution && !loading && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Distribution: {distribution.column}</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-xs text-muted-foreground">Mean</p>
                <p className="text-sm font-medium text-foreground">{distribution.statistics.mean.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Median</p>
                <p className="text-sm font-medium text-foreground">{distribution.statistics.median.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Std Dev</p>
                <p className="text-sm font-medium text-foreground">{distribution.statistics.std.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IQR</p>
                <p className="text-sm font-medium text-foreground">{distribution.statistics.iqr.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Range</p>
                <p className="text-sm font-medium text-foreground">
                  {distribution.statistics.min.toFixed(2)} - {distribution.statistics.max.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Histogram</h4>
            <div className="flex items-end gap-1 h-40">
              {distribution.bins.map((bin, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/70 rounded-t"
                  style={{ height: maxCount > 0 ? `${(bin.count / maxCount) * 100}%` : '0%' }}
                  title={`${bin.start.toFixed(2)} - ${bin.end.toFixed(2)}: ${bin.count}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{distribution.statistics.min.toFixed(2)}</span>
              <span>{distribution.statistics.max.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Potential Outliers</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Count</p>
                <p className="text-sm font-medium text-foreground">{distribution.outliers.count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Percentage</p>
                <p className="text-sm font-medium text-foreground">{distribution.outliers.percentage.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lower Bound</p>
                <p className="text-sm font-medium text-foreground">{distribution.outliers.lower_bound.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upper Bound</p>
                <p className="text-sm font-medium text-foreground">{distribution.outliers.upper_bound.toFixed(4)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Method: {distribution.outliers.method}. These are potential outliers, not automatically errors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
