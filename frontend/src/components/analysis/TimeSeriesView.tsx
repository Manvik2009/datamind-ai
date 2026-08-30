import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, TimeSeriesResult } from '@/types/analysis';
import { apiClient } from '@/lib/api';

interface TimeSeriesViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const TimeSeriesView = ({ dataset, overview }: TimeSeriesViewProps) => {
  const [dateColumn, setDateColumn] = useState<string>('');
  const [valueColumn, setValueColumn] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [aggregation, setAggregation] = useState<string>('SUM');
  const [result, setResult] = useState<TimeSeriesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateColumns = overview?.date_columns || [];
  const numericColumns = overview?.numeric_columns || [];

  useEffect(() => {
    if (dateColumns.length > 0 && !dateColumn) {
      setDateColumn(dateColumns[0]);
    }
    if (numericColumns.length > 0 && !valueColumn) {
      setValueColumn(numericColumns[0]);
    }
  }, [dateColumns, numericColumns]);

  const handleAnalyze = async () => {
    if (!dateColumn || !valueColumn) return;

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.postAnalysisTimeSeries(dataset.id, dateColumn, valueColumn, frequency, aggregation);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run time series analysis');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (dateColumns.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Time Series Analysis</h3>
          <p className="text-sm text-muted-foreground">Analyze trends over time</p>
        </div>
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          No valid date/time column detected. Time series analysis requires a date column.
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...(result?.rows.map((r) => r.value) || [0]));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Time Series Analysis</h3>
        <p className="text-sm text-muted-foreground">Analyze trends over time</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Configuration</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Date Column</label>
            <select
              value={dateColumn}
              onChange={(e) => setDateColumn(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {dateColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Value Column</label>
            <select
              value={valueColumn}
              onChange={(e) => setValueColumn(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Aggregation</label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="SUM">Sum</option>
              <option value="AVG">Average</option>
              <option value="COUNT">Count</option>
              <option value="MIN">Minimum</option>
              <option value="MAX">Maximum</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !dateColumn || !valueColumn}
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
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            {result.aggregation} of {result.value_column} by {result.frequency} frequency
          </h4>
          {result.rows.length > 0 ? (
            <div className="space-y-1">
              {result.rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24">{row.date}</span>
                  <div className="flex-1 h-6 bg-secondary rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded"
                      style={{ width: maxValue > 0 ? `${(row.value / maxValue) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-foreground w-20 text-right">
                    {row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No time series data available.</p>
          )}
        </div>
      )}
    </div>
  );
};
