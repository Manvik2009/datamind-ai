import { useState, useEffect } from 'react';
import { DataSummary } from '@/types/settings';
import { apiClient } from '@/lib/api';

export const DataSettings = () => {
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDataSummary();
  }, []);

  const loadDataSummary = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDataSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading data summary...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  const dataItems = [
    { label: 'Datasets', value: summary?.datasets ?? 0 },
    { label: 'Saved Analyses', value: summary?.analyses ?? 0 },
    { label: 'ML Experiments', value: summary?.experiments ?? 0 },
    { label: 'AI Analyses', value: summary?.ai_analyses ?? 0 },
    { label: 'Reports', value: summary?.reports ?? 0 },
    { label: 'Predictions', value: summary?.predictions ?? 0 },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Data & Storage</h3>
        <p className="text-sm text-muted-foreground">View your data usage and storage</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dataItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Export Your Data</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Download all your data in JSON format. This includes datasets, experiments, analyses, and insights.
        </p>
        <button
          onClick={async () => {
            try {
              const data = await apiClient.exportUserData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'datamind-data-export.json';
              a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              setError('Failed to export data');
            }
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Export My Data
        </button>
      </div>
    </div>
  );
};
