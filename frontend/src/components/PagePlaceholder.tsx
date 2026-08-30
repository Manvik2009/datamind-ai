interface PagePlaceholderProps {
  title: string;
  description: string;
}

export const PagePlaceholder = ({ title, description }: PagePlaceholderProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
        Coming in Phase 2
      </span>
    </div>
  );
};
