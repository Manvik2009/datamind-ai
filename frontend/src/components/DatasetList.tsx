import { DatasetRecord } from '@/types/dataset';

interface DatasetListProps {
  datasets: DatasetRecord[];
  onSelect: (dataset: DatasetRecord) => void;
}

export const DatasetList = ({ datasets, onSelect }: DatasetListProps) => {
  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No datasets uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {datasets.map((dataset) => (
        <button
          key={dataset.id}
          onClick={() => onSelect(dataset)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
        >
          <div>
            <p className="font-medium text-foreground">{dataset.original_filename}</p>
            <p className="text-xs text-muted-foreground">
              {dataset.row_count.toLocaleString()} rows × {dataset.column_count} columns
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {dataset.status}
          </span>
        </button>
      ))}
    </div>
  );
};
