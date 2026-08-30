interface ModelPerformanceCardProps {
  experiment: {
    id: string;
    name: string;
    modelType: string;
    status: string;
    primaryMetric: string | null;
    primaryMetricValue: number | null;
    targetColumn: string;
    createdAt: string;
  };
  onClick?: () => void;
}

export const ModelPerformanceCard = ({ experiment, onClick }: ModelPerformanceCardProps) => {
  const formatMetricValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    return value.toFixed(3);
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-border bg-card p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-all' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-foreground">{experiment.name}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{experiment.modelType}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          experiment.status === 'COMPLETED'
            ? 'bg-green-500/20 text-green-400'
            : experiment.status === 'RUNNING'
            ? 'bg-blue-500/20 text-blue-400'
            : experiment.status === 'FAILED'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          {experiment.status}
        </span>
      </div>
      {experiment.primaryMetricValue !== null && experiment.primaryMetric && (
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatMetricValue(experiment.primaryMetricValue)}
          </span>
          <span className="text-sm text-muted-foreground">{experiment.primaryMetric}</span>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Target: {experiment.targetColumn}</p>
    </div>
  );
};
