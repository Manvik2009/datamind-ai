interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = ({ className = '', style }: SkeletonProps) => (
  <div className={`animate-pulse rounded bg-muted/50 ${className}`} style={style} />
);

export const SkeletonCard = () => (
  <div className="rounded-lg border border-border bg-card p-6 space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-lg border border-border overflow-hidden">
    <div className="border-b border-border bg-secondary/50 p-4">
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-t border-border p-4">
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="rounded-lg border border-border bg-card p-6">
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="flex items-end justify-between h-48 gap-2">
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 45, 70].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);
