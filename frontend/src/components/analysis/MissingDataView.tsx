import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { MissingDataAnalysis } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface MissingDataViewProps {
  dataset: DatasetRecord;
}

export const MissingDataView = ({ dataset }: MissingDataViewProps) => {
  const [missingData, setMissingData] = useState<MissingDataAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMissingData();
  }, [dataset.id]);

  const loadMissingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getAnalysisMissingData(dataset.id);
      setMissingData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load missing data analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Analyzing missing data..." />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!missingData) {
    return <p className="text-sm text-muted-foreground">No missing data analysis available.</p>;
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'complete': return 'bg-green-500/20 text-green-400';
      case 'low_missingness': return 'bg-blue-500/20 text-blue-400';
      case 'moderate_missingness': return 'bg-yellow-500/20 text-yellow-400';
      case 'high_missingness': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Missing Data Analysis</h3>
        <p className="text-sm text-muted-foreground">Identify columns with missing values that may need attention</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Missing Values</p>
          <p className="text-2xl font-semibold text-foreground">{missingData.total_missing.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Overall Missing Percentage</p>
          <p className="text-2xl font-semibold text-foreground">{missingData.total_percentage.toFixed(2)}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Columns Affected</p>
          <p className="text-2xl font-semibold text-foreground">{missingData.columns.length}</p>
        </div>
      </div>

      {missingData.columns.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-3 text-left text-xs font-medium text-foreground">Column</th>
                <th className="p-3 text-left text-xs font-medium text-foreground">Missing Count</th>
                <th className="p-3 text-left text-xs font-medium text-foreground">Missing %</th>
                <th className="p-3 text-left text-xs font-medium text-foreground">Category</th>
              </tr>
            </thead>
            <tbody>
              {missingData.columns
                .sort((a, b) => b.missing_percentage - a.missing_percentage)
                .map((col) => (
                  <tr key={col.column} className="border-b border-border last:border-0">
                    <td className="p-3 text-foreground font-medium">{col.column}</td>
                    <td className="p-3 text-muted-foreground">{col.missing_count.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, col.missing_percentage)}%` }}
                          />
                        </div>
                        <span className="text-foreground w-12 text-right">{col.missing_percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${getCategoryColor(col.category)}`}>
                        {col.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          No missing values detected in this dataset.
        </div>
      )}

      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <p className="text-xs text-yellow-400">Missing data analysis does not modify the dataset. Consider data quality workflows for remediation strategies.</p>
      </div>
    </div>
  );
};
