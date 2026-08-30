import { DatasetSummary } from '@/types/dashboard';

interface DatasetCardProps {
  dataset: DatasetSummary;
  onClick?: () => void;
}

export const DatasetCard = ({ dataset, onClick }: DatasetCardProps) => {
  const qualityColor = dataset.qualityScore
    ? dataset.qualityScore >= 80
      ? 'text-green-400'
      : dataset.qualityScore >= 60
      ? 'text-yellow-400'
      : 'text-red-400'
    : 'text-muted-foreground';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border bg-card p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-all' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{dataset.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {dataset.rowCount.toLocaleString()} rows · {dataset.columnCount} columns
          </p>
        </div>
        {dataset.qualityScore !== null && (
          <span className={`text-sm font-medium ${qualityColor}`}>
            Q: {dataset.qualityScore}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          dataset.status === 'ready'
            ? 'bg-green-500/20 text-green-400'
            : dataset.status === 'processing'
            ? 'bg-yellow-500/20 text-yellow-400'
            : dataset.status === 'error'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          {dataset.status}
        </span>
      </div>
    </div>
  );
};
