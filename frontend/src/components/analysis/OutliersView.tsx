import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, OutlierAnalysis } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface OutliersViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const OutliersView = ({ dataset, overview }: OutliersViewProps) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'IQR' | 'ZSCORE'>('IQR');
  const [outliers, setOutliers] = useState<OutlierAnalysis | null>(null);
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
      analyzeOutliers(selectedColumn);
    }
  }, [selectedColumn, selectedMethod, dataset.id]);

  const analyzeOutliers = async (column: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getAnalysisOutliers(dataset.id, column, selectedMethod);
      setOutliers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze outliers');
      setOutliers(null);
    } finally {
      setLoading(false);
    }
  };

  if (numericColumns.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Outlier Analysis</h3>
          <p className="text-sm text-muted-foreground">Detect potential outliers in numeric columns</p>
        </div>
        <p className="text-sm text-muted-foreground">No numeric columns available for outlier analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Outlier Analysis</h3>
        <p className="text-sm text-muted-foreground">Detect potential outliers in numeric columns</p>
      </div>

      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <p className="text-xs text-yellow-400">Potential outliers are not automatically errors. They may represent valid extreme values, data quality issues, or interesting patterns requiring investigation.</p>
      </div>

      <div className="flex gap-4 items-end">
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
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as 'IQR' | 'ZSCORE')}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="IQR">IQR (1.5 x IQR)</option>
            <option value="ZSCORE">Z-Score (3 sigma)</option>
          </select>
        </div>
      </div>

      {loading && <Loading message="Analyzing outliers..." />}

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {outliers && !loading && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Outliers: {outliers.column}</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Potential Outliers</p>
                <p className="text-2xl font-semibold text-foreground">{outliers.outlier_count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Percentage</p>
                <p className="text-2xl font-semibold text-foreground">{outliers.outlier_percentage.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lower Bound</p>
                <p className="text-sm font-medium text-foreground">{outliers.lower_bound.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upper Bound</p>
                <p className="text-sm font-medium text-foreground">{outliers.upper_bound.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Method Details</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="text-sm font-medium text-foreground">{outliers.method}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Threshold</p>
                <p className="text-sm font-medium text-foreground">{outliers.threshold} x {outliers.method === 'IQR' ? 'IQR' : 'Std Dev'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Observations</p>
                <p className="text-sm font-medium text-foreground">{outliers.total_count.toLocaleString()}</p>
              </div>
            </div>
            {outliers.note && (
              <p className="mt-3 text-xs text-muted-foreground">{outliers.note}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
