import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { ColumnExploration } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface ColumnExplorerViewProps {
  dataset: DatasetRecord;
}

export const ColumnExplorerView = ({ dataset }: ColumnExplorerViewProps) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [exploration, setExploration] = useState<ColumnExploration | null>(null);
  const [loading, setLoading] = useState(true);
  const [exploring, setExploring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadColumns();
  }, [dataset.id]);

  useEffect(() => {
    if (selectedColumn) {
      exploreColumn(selectedColumn);
    }
  }, [selectedColumn, dataset.id]);

  const loadColumns = async () => {
    try {
      setLoading(true);
      const overview = await apiClient.getAnalysisDatasetOverview(dataset.id);
      const allColumns = [
        ...overview.numeric_columns,
        ...overview.categorical_columns,
        ...overview.date_columns,
      ];
      setColumns(allColumns);
      if (allColumns.length > 0) {
        setSelectedColumn(allColumns[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load columns');
    } finally {
      setLoading(false);
    }
  };

  const exploreColumn = async (columnName: string) => {
    try {
      setExploring(true);
      const result = await apiClient.exploreAnalysisColumn(dataset.id, columnName);
      setExploration(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explore column');
    } finally {
      setExploring(false);
    }
  };

  if (loading) {
    return <Loading message="Loading columns..." />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Column Explorer</h3>
        <p className="text-sm text-muted-foreground">Explore individual columns in your dataset</p>
      </div>

      <div className="flex gap-4">
        <div className="w-48 flex-shrink-0">
          <label className="block text-xs font-medium text-foreground mb-1">Select Column</label>
          <select
            value={selectedColumn || ''}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          {exploring && <Loading message="Exploring column..." />}

          {exploration && !exploring && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-medium text-foreground mb-3">{exploration.column}</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Data Type</p>
                    <p className="text-sm font-medium text-foreground">{exploration.detected_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unique Values</p>
                    <p className="text-sm font-medium text-foreground">{exploration.unique_values.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Missing</p>
                    <p className="text-sm font-medium text-foreground">
                      {exploration.missing.toLocaleString()} ({exploration.missing_percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>

              {exploration.numeric_stats && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">Numeric Statistics</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Mean</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.mean?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Median</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.median?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Std Dev</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.std?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IQR</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.iqr?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Min</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.min?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.max?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Q1</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.q1?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Q3</p>
                      <p className="text-sm font-medium text-foreground">
                        {exploration.numeric_stats.q3?.toFixed(4) ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {exploration.categorical_stats && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">Categorical Statistics</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Unique Count</p>
                      <p className="text-sm font-medium text-foreground">{exploration.categorical_stats.unique_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Most Frequent</p>
                      <p className="text-sm font-medium text-foreground">{exploration.categorical_stats.most_frequent ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Top Frequency</p>
                      <p className="text-sm font-medium text-foreground">{exploration.categorical_stats.most_frequent_count}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!exploration && !exploring && columns.length === 0 && (
            <p className="text-sm text-muted-foreground">No columns available for exploration.</p>
          )}
        </div>
      </div>
    </div>
  );
};
