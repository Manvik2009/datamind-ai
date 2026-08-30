import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

export const StatCard = ({ title, value, subtitle, icon, onClick, loading }: StatCardProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="mt-3 h-8 w-16 rounded bg-muted" />
          <div className="mt-2 h-3 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border bg-card p-6 ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
    </div>
  );
};
