import { JobSummary } from '@/types/dashboard';

interface JobStatusCardProps {
  job: JobSummary;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RUNNING':
      return 'text-blue-400';
    case 'QUEUED':
      return 'text-yellow-400';
    case 'COMPLETED':
      return 'text-green-400';
    case 'FAILED':
      return 'text-red-400';
    case 'CANCELLED':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
};

const formatJobType = (type: string): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export const JobStatusCard = ({ job }: JobStatusCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{formatJobType(job.jobType)}</p>
          <p className={`text-xs font-medium capitalize ${getStatusColor(job.status)}`}>{job.status.toLowerCase()}</p>
        </div>
        {job.status === 'RUNNING' && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{job.progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
