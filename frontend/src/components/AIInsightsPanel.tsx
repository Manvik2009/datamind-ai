import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface AIInsightsPanelProps {
  datasetId?: string;
  experimentId?: string;
}

interface Insight {
  type: 'finding' | 'pattern' | 'issue' | 'suggestion';
  title: string;
  description: string;
}

export const AIInsightsPanel = ({ datasetId, experimentId }: AIInsightsPanelProps) => {
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (experimentId) {
        result = await apiClient.getAIInsights(experimentId);
        const rawInsights = result.insights || [];
        setInsights(rawInsights.map((i: any) => ({
          type: i.type || 'finding',
          title: i.title || 'Insight',
          description: i.description || i.content || '',
        })));
      } else if (datasetId) {
        result = await apiClient.getAIDatasetSummary(datasetId);
        const summary = result.summary;
        const formattedInsights: Insight[] = [];
        if (summary.overview) {
          formattedInsights.push({ type: 'finding', title: 'Dataset Overview', description: summary.overview });
        }
        if (summary.patterns) {
          formattedInsights.push({ type: 'pattern', title: 'Patterns Detected', description: summary.patterns });
        }
        if (summary.issues) {
          formattedInsights.push({ type: 'issue', title: 'Potential Issues', description: summary.issues });
        }
        setInsights(formattedInsights);
      }
    } catch (err) {
      setError('Unable to generate insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Analyzing...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <button onClick={generateInsights} className="text-sm text-primary hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <button
          onClick={generateInsights}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generate AI Insights
        </button>
      </div>
    );
  }

  const typeColors = {
    finding: 'text-blue-400 bg-blue-500/10',
    pattern: 'text-purple-400 bg-purple-500/10',
    issue: 'text-yellow-400 bg-yellow-500/10',
    suggestion: 'text-green-400 bg-green-500/10',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Insights
      </h4>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`rounded-md p-3 ${typeColors[insight.type]}`}>
            <p className="text-xs font-medium mb-1">{insight.title}</p>
            <p className="text-xs opacity-80">{insight.description}</p>
          </div>
        ))}
      </div>
      <button
        onClick={generateInsights}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Regenerate
      </button>
    </div>
  );
};
