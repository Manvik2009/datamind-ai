import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, GroupByResult } from '@/types/analysis';
import { apiClient } from '@/lib/api';

interface GroupByViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const GroupByView = ({ dataset, overview }: GroupByViewProps) => {
  const [groupByColumn, setGroupByColumn] = useState<string>('');
  const [measureColumn, setMeasureColumn] = useState<string>('');
  const [aggregation, setAggregation] = useState<string>('AVG');
  const [result, setResult] = useState<GroupByResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoricalColumns = overview?.categorical_columns || [];
  const numericColumns = overview?.numeric_columns || [];

  useEffect(() => {
    if (categoricalColumns.length > 0 && !groupByColumn) {
      setGroupByColumn(categoricalColumns[0]);
    }
    if (numericColumns.length > 0 && !measureColumn) {
      setMeasureColumn(numericColumns[0]);
    }
  }, [categoricalColumns, numericColumns]);

  const handleAnalyze = async () => {
    if (!groupByColumn || !measureColumn) return;

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.postAnalysisGroupBy(dataset.id, groupByColumn, measureColumn, aggregation);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run group-by analysis');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...(result?.rows.map((r) => r.result) || [0]));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Group-By Analysis</h3>
        <p className="text-sm text-muted-foreground">Aggregate data by categories</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Configuration</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Group By</label>
            <select
              value={groupByColumn}
              onChange={(e) => setGroupByColumn(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {categoricalColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Measure</label>
            <select
              value={measureColumn}
              onChange={(e) => setMeasureColumn(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Aggregation</label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="COUNT">Count</option>
              <option value="SUM">Sum</option>
              <option value="AVG">Average</option>
              <option value="MIN">Minimum</option>
              <option value="MAX">Maximum</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !groupByColumn || !measureColumn}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-3 text-left text-xs font-medium text-foreground">{result.group_by}</th>
                <th className="p-3 text-left text-xs font-medium text-foreground">{result.aggregation} of {result.measure}</th>
                <th className="p-3 text-left text-xs font-medium text-foreground">Count</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground font-medium">{row.group_value}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden w-24">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: maxValue > 0 ? `${(row.result / maxValue) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-foreground">{row.result.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{row.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
