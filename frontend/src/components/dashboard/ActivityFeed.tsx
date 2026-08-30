import { ActivityItem } from '@/types/dashboard';

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  onFilter?: (type: string) => void;
}

const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    prediction: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    scenario: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    report: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    recommendation: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    sensitivity_analysis: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
  };
  return icons[type] || 'M13 10V3L4 14h7v7l9-11h-7z';
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const ActivityFeed = ({ activities, loading, onFilter }: ActivityFeedProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {onFilter && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['all', 'prediction', 'scenario', 'report', 'recommendation'].map((filter) => (
            <button
              key={filter}
              onClick={() => onFilter(filter)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors capitalize"
            >
              {filter === 'all' ? 'All' : filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
      {activities.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActivityIcon(activity.type)} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
