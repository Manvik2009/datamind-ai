import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview, ChartConfiguration, ChartResult } from '@/types/analysis';
import { apiClient } from '@/lib/api';

interface ChartsViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const ChartsView = ({ dataset, overview }: ChartsViewProps) => {
  const [chartType, setChartType] = useState<string>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [aggregation, setAggregation] = useState<string>('COUNT');
  const [chartResult, setChartResult] = useState<ChartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allColumns = [
    ...(overview?.numeric_columns || []),
    ...(overview?.categorical_columns || []),
    ...(overview?.date_columns || []),
  ];

  useEffect(() => {
    if (allColumns.length > 0 && !xAxis) {
      setXAxis(allColumns[0]);
    }
    if (overview?.numeric_columns && overview.numeric_columns.length > 0 && !yAxis) {
      setYAxis(overview.numeric_columns[0]);
    }
  }, [allColumns, overview]);

  const handleCreateChart = async () => {
    if (!xAxis) return;

    try {
      setLoading(true);
      setError(null);

      const config: ChartConfiguration = {
        chart_type: chartType as ChartConfiguration['chart_type'],
        x_axis: xAxis,
        y_axis: yAxis || undefined,
        aggregation: aggregation as ChartConfiguration['aggregation'],
      };

      const result = await apiClient.postAnalysisChart(dataset.id, config);
      setChartResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chart');
      setChartResult(null);
    } finally {
      setLoading(false);
    }
  };

  const maxChartValue = Math.max(...(chartResult?.data.map((d) => d.value) || [0]));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Custom Chart Builder</h3>
        <p className="text-sm text-muted-foreground">Create visualizations from your dataset</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Chart Configuration</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="histogram">Histogram</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">X Axis</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {allColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Y Axis</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="">None (count)</option>
              {(overview?.numeric_columns || []).map((col) => (
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
          onClick={handleCreateChart}
          disabled={loading || !xAxis}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Chart'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {chartResult && !loading && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            {chartResult.chart_type.charAt(0).toUpperCase() + chartResult.chart_type.slice(1)} Chart
          </h4>
          {chartResult.data.length > 0 ? (
            <div className="space-y-1">
              {chartResult.data.map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 truncate">{point.label}</span>
                  <div className="flex-1 h-6 bg-secondary rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded"
                      style={{ width: maxChartValue > 0 ? `${(point.value / maxChartValue) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-foreground w-16 text-right">
                    {typeof point.value === 'number' ? point.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : point.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data to display.</p>
          )}
          {chartResult.metadata && (
            <p className="mt-3 text-xs text-muted-foreground">
              Sample size: {chartResult.metadata.sample_size.toLocaleString()}
              {chartResult.metadata.is_sampled && ` (sampled from ${chartResult.metadata.total_rows?.toLocaleString()})`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
