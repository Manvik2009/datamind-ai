import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface DataQualityExplanationProps {
  datasetId: string;
  issue: string;
  value: string;
}

export const DataQualityExplanation = ({ datasetId, issue, value }: DataQualityExplanationProps) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getAIDataQuality(datasetId);
      setExplanation(result.explanation || getLocalExplanation(issue, value));
    } catch (err) {
      setExplanation(getLocalExplanation(issue, value));
    } finally {
      setLoading(false);
    }
  };

  const getLocalExplanation = (issueType: string, val: string): string => {
    const explanations: Record<string, string> = {
      'Missing Values': `Missing values (${val}) can reduce analysis reliability and may require appropriate handling before machine learning training. Common strategies include imputation or removal.`,
      'Duplicate Records': `Duplicate records (${val}) can skew analysis results and model training. Consider deduplication to ensure data integrity.`,
      'Data Type Mismatches': `Data type inconsistencies (${val}) can cause errors in analysis. Ensure consistent data types across columns.`,
      'Outliers': `Outliers (${val}) may indicate data errors or interesting anomalies. Investigate before deciding to keep or remove them.`,
    };
    return explanations[issueType] || `${issueType}: ${val}. This metric indicates a potential data quality consideration.`;
  };

  if (loading) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Analyzing...
      </span>
    );
  }

  if (error) {
    return (
      <button onClick={handleExplain} className="text-xs text-primary hover:underline">
        Why does this matter?
      </button>
    );
  }

  if (!explanation) {
    return (
      <button
        onClick={handleExplain}
        className="text-xs text-muted-foreground hover:text-primary transition-colors"
        title="Get AI explanation for this issue"
      >
        Why does this matter?
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md bg-secondary/50 p-2 animate-fade-in">
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </div>
  );
};
