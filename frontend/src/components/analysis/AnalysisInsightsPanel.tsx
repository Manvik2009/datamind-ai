import { useState } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { AnalysisSession } from '@/types/analysis';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface AnalysisInsightsPanelProps {
  dataset: DatasetRecord | null;
  session: AnalysisSession | null;
}

interface AIInsight {
  observed_result: string;
  interpretation: string;
  hypothesis?: string;
  limitations: string;
  suggested_next_steps?: string[];
}

export const AnalysisInsightsPanel = ({ dataset }: AnalysisInsightsPanelProps) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');

  const quickQuestions = [
    'What stands out?',
    'Find unusual patterns',
    'Summarize key findings',
    'Identify anomalies',
  ];

  const generateInsights = async (_q?: string) => {
    if (!dataset) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<{ response: AIInsight }>('/ai/datasets/' + dataset.id + '/summary', {});
      if (response?.response) {
        setInsights([response.response]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!dataset || !question.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<{ response: AIInsight }>('/ai/query', {
        dataset_id: dataset.id,
        question: question.trim(),
      });

      if (response?.response) {
        setInsights((prev) => [response.response, ...prev]);
        setQuestion('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-border bg-card">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Analyst</h3>

        <div className="space-y-2 mb-4">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => generateInsights(q)}
              disabled={loading || !dataset}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-foreground hover:bg-secondary disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-foreground mb-1">Ask about this analysis...</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
              placeholder="Type your question..."
              className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={askQuestion}
              disabled={loading || !question.trim() || !dataset}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </div>

        {loading && <Loading message="Analyzing..." />}

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="rounded-lg border border-border bg-secondary/50 p-3">
                {insight.observed_result && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-blue-400 mb-1">OBSERVED</p>
                    <p className="text-xs text-foreground">{insight.observed_result}</p>
                  </div>
                )}
                {insight.interpretation && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-green-400 mb-1">INTERPRETATION</p>
                    <p className="text-xs text-foreground">{insight.interpretation}</p>
                  </div>
                )}
                {insight.hypothesis && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-yellow-400 mb-1">HYPOTHESIS</p>
                    <p className="text-xs text-foreground">{insight.hypothesis}</p>
                  </div>
                )}
                {insight.limitations && (
                  <div>
                    <p className="text-xs font-medium text-orange-400 mb-1">LIMITATIONS</p>
                    <p className="text-xs text-muted-foreground">{insight.limitations}</p>
                  </div>
                )}
                {insight.suggested_next_steps && insight.suggested_next_steps.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-purple-400 mb-1">SUGGESTED NEXT STEPS</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {insight.suggested_next_steps.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!dataset && (
          <p className="text-xs text-muted-foreground">Select a dataset to use AI analysis.</p>
        )}
      </div>
    </div>
  );
};
