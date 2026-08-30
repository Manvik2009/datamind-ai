import { DatasetRecord } from '@/types/dataset';

interface DatasetSelectorProps {
  datasets: DatasetRecord[];
  selectedDataset: DatasetRecord | null;
  onSelect: (dataset: DatasetRecord) => void;
}

export const DatasetSelector = ({ datasets, selectedDataset, onSelect }: DatasetSelectorProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Dataset</h3>
      {selectedDataset ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground truncate">{selectedDataset.original_filename}</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{selectedDataset.row_count.toLocaleString()} rows</p>
            <p>{selectedDataset.column_count} columns</p>
            <p className="capitalize">Status: {selectedDataset.status}</p>
          </div>
          <select
            value={selectedDataset.id}
            onChange={(e) => {
              const ds = datasets.find((d) => d.id === e.target.value);
              if (ds) onSelect(ds);
            }}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground mt-2"
          >
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>{ds.original_filename}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No dataset selected.</p>
      )}
    </div>
  );
};
