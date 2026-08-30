import { InsightSummary } from '@/types/dashboard';

interface InsightCardProps {
  insight: InsightSummary;
  onClick?: () => void;
}

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'border-red-500/30 bg-red-500/10';
    case 'warning':
      return 'border-yellow-500/30 bg-yellow-500/10';
    case 'info':
    default:
      return 'border-blue-500/30 bg-blue-500/10';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
    case 'info':
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
    default:
      return 'text-blue-400';
  }
};

export const InsightCard = ({ insight, onClick }: InsightCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-4 ${getSeverityStyles(insight.severity)} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      <div className="flex items-start gap-3">
        <svg className={`h-5 w-5 shrink-0 ${getSeverityColor(insight.severity)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getSeverityIcon(insight.severity)} />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getSeverityColor(insight.severity)} bg-background/50`}>
              {insight.severity}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{insight.category}</span>
          </div>
          <p className="mt-2 text-sm text-foreground">{insight.title}</p>
        </div>
      </div>
    </div>
  );
};
