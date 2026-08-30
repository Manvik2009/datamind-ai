import { useState } from 'react';

interface AIChartExplanationProps {
  chartType: string;
  dataDescription: string;
  onExplain?: () => Promise<string>;
}

export const AIChartExplanation = ({ chartType, dataDescription, onExplain }: AIChartExplanationProps) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onExplain) {
        const result = await onExplain();
        setExplanation(result);
      } else {
        setExplanation(
          `This ${chartType} shows ${dataDescription}. ` +
          `To interpret this visualization, look for patterns, trends, and notable differences in the data.`
        );
      }
    } catch (err) {
      setError('Unable to generate explanation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Analyzing chart...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <button onClick={handleExplain} className="text-sm text-primary hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!explanation) {
    return (
      <button
        onClick={handleExplain}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Explain this chart
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Chart Explanation
      </h4>
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </div>
  );
};
