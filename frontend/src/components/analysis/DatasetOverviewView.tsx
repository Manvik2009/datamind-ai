import { DatasetRecord } from '@/types/dataset';
import { DatasetOverview } from '@/types/analysis';

interface DatasetOverviewViewProps {
  dataset: DatasetRecord;
  overview: DatasetOverview | null;
}

export const DatasetOverviewView = ({ dataset, overview }: DatasetOverviewViewProps) => {
  if (!overview) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">No overview data available for this dataset.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Rows', value: overview.row_count.toLocaleString() },
    { label: 'Columns', value: overview.column_count.toString() },
    { label: 'Numeric Columns', value: overview.numeric_columns.length.toString() },
    { label: 'Categorical Columns', value: overview.categorical_columns.length.toString() },
    { label: 'Date Columns', value: overview.date_columns.length.toString() },
    { label: 'Missing Values', value: overview.missing_values.toLocaleString() },
    { label: 'Duplicate Rows', value: overview.duplicate_rows.toLocaleString() },
    { label: 'Quality Score', value: overview.quality_score ? `${overview.quality_score}/100` : 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Dataset Overview</h3>
        <p className="text-sm text-muted-foreground">{dataset.original_filename}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {overview.numeric_columns.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Numeric Columns</h4>
          <div className="flex flex-wrap gap-2">
            {overview.numeric_columns.map((col) => (
              <span key={col} className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {overview.categorical_columns.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Categorical Columns</h4>
          <div className="flex flex-wrap gap-2">
            {overview.categorical_columns.map((col) => (
              <span key={col} className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {overview.date_columns.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Date Columns</h4>
          <div className="flex flex-wrap gap-2">
            {overview.date_columns.map((col) => (
              <span key={col} className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
