import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, CorrelationResult, CorrelationMatrix } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface CorrelationViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const CorrelationView = ({ dataset, overview }: CorrelationViewProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'pearson' | 'spearman'>('pearson');
  const [columnA, setColumnA] = useState<string>('');
  const [columnB, setColumnB] = useState<string>('');
  const [correlation, setCorrelation] = useState<CorrelationResult | null>(null);
  const [matrix, setMatrix] = useState<CorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericColumns = overview?.numeric_columns || [];

  useEffect(() => {
    if (numericColumns.length >= 2) {
      setColumnA(numericColumns[0]);
      setColumnB(numericColumns[1]);
    }
  }, [numericColumns]);

  useEffect(() => {
    loadMatrix();
  }, [dataset.id, selectedMethod]);

  useEffect(() => {
    if (columnA && columnB && columnA !== columnB) {
      loadCorrelation();
    }
  }, [columnA, columnB, selectedMethod, dataset.id]);

  const loadCorrelation = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getAnalysisCorrelation(dataset.id, columnA, columnB, selectedMethod);
      setCorrelation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate correlation');
      setCorrelation(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMatrix = async () => {
    try {
      const result = await apiClient.getAnalysisCorrelationMatrix(dataset.id, selectedMethod);
      setMatrix(result);
    } catch (err) {
      console.error('Failed to load correlation matrix:', err);
    }
  };

  if (numericColumns.length < 2) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Correlation Analysis</h3>
          <p className="text-sm text-muted-foreground">Analyze relationships between numeric variables</p>
        </div>
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          Select at least two numeric columns to calculate correlation.
        </div>
      </div>
    );
  }

  const getCorrelationColor = (value: number | null): string => {
    if (value === null) return 'bg-gray-500/20';
    const abs = Math.abs(value);
    if (abs >= 0.7) return value > 0 ? 'bg-green-500/40' : 'bg-red-500/40';
    if (abs >= 0.4) return value > 0 ? 'bg-green-500/20' : 'bg-red-500/20';
    return 'bg-gray-500/10';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Correlation Analysis</h3>
        <p className="text-sm text-muted-foreground">Analyze relationships between numeric variables</p>
      </div>

      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <p className="text-xs text-yellow-400 font-medium">IMPORTANT</p>
        <p className="text-xs text-muted-foreground mt-1">
          Correlation does NOT imply causation. A correlation coefficient measures the strength and direction
          of a linear relationship between two variables.
        </p>
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as 'pearson' | 'spearman')}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="pearson">Pearson</option>
            <option value="spearman">Spearman</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Variable A</label>
          <select
            value={columnA}
            onChange={(e) => setColumnA(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {numericColumns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Variable B</label>
          <select
            value={columnB}
            onChange={(e) => setColumnB(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {numericColumns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading message="Calculating correlation..." />}

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {correlation && !loading && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            {correlation.column_a} vs {correlation.column_b}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Correlation Coefficient</p>
              <p className="text-2xl font-semibold text-foreground">
                {correlation.coefficient?.toFixed(4) ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Method</p>
              <p className="text-sm font-medium text-foreground capitalize">{correlation.method}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sample Size</p>
              <p className="text-sm font-medium text-foreground">{correlation.sample_size?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Relationship</p>
              <p className="text-sm font-medium text-foreground">{correlation.relationship}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">
              {correlation.method === 'pearson'
                ? 'Pearson correlation measures linear relationships between variables.'
                : 'Spearman correlation measures monotonic relationships (rank-based).'}
              {' '}This indicates association, not causation.
            </p>
          </div>
        </div>
      )}

      {matrix && matrix.columns.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Correlation Matrix</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs text-muted-foreground"></th>
                  {matrix.columns.map((col) => (
                    <th key={col} className="p-2 text-xs text-muted-foreground font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.columns.map((colA, i) => (
                  <tr key={colA}>
                    <td className="p-2 text-xs font-medium text-foreground">{colA}</td>
                    {matrix.columns.map((colB, j) => (
                      <td
                        key={colB}
                        className={`p-2 text-center ${getCorrelationColor(matrix.matrix[i][j])}`}
                      >
                        {matrix.matrix[i][j] !== null ? matrix.matrix[i][j]!.toFixed(2) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
