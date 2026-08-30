import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface AICopilotPanelProps {
  datasetId?: string;
  context?: string;
  placeholder?: string;
}

export const AICopilotPanel = ({ datasetId, context, placeholder = 'Ask about this dataset...' }: AICopilotPanelProps) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim() || !datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.queryAI(datasetId, question);
      setResponse(result.response || 'No response generated.');
    } catch (err) {
      setError('Unable to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Copilot
      </h4>

      {context && (
        <p className="text-xs text-muted-foreground mb-3">Context: {context}</p>
      )}

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={!datasetId}
          className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !question.trim() || !datasetId}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Ask'
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}

      {response && (
        <div className="rounded-md bg-secondary/50 p-3 animate-fade-in">
          <p className="text-sm text-foreground whitespace-pre-wrap">{response}</p>
        </div>
      )}

      {!datasetId && (
        <p className="text-xs text-muted-foreground">Select a dataset to ask questions.</p>
      )}
    </div>
  );
};
