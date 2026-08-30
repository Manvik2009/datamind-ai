import { useState, useEffect } from 'react';
import { DatasetRecord, DatasetDetail } from '@/types/dataset';
import { MLExperiment } from '@/types/ml';
import { AIDatasetSummary, AIDataQualityExplanation, AIInsight, AIQueryResponse, AIMLExplanation } from '@/types/ai';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

type Tab = 'summary' | 'quality' | 'explain' | 'insights' | 'ask';

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium transition-colors ${
      active ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

export const Insights = () => {
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [experiments, setExperiments] = useState<MLExperiment[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<MLExperiment | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<AIDatasetSummary | null>(null);
  const [quality, setQuality] = useState<AIDataQualityExplanation | null>(null);
  const [explanation, setExplanation] = useState<AIMLExplanation | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [question, setQuestion] = useState('');
  const [queryResponse, setQueryResponse] = useState<AIQueryResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [datasetsRes, experimentsRes] = await Promise.all([
        apiClient.get<DatasetRecord[]>('/datasets'),
        apiClient.get<MLExperiment[]>('/ml'),
      ]);
      setDatasets(datasetsRes || []);
      setExperiments(experimentsRes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = async (dataset: DatasetRecord) => {
    try {
      const detail = await apiClient.get<DatasetDetail>(`/datasets/${dataset.id}`);
      setSelectedDataset(detail);
      setSelectedExperiment(null);
      setActiveTab('summary');
      setSummary(null);
      setQuality(null);
      setExplanation(null);
      setInsights([]);
      setQueryResponse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    }
  };

  const handleExperimentSelect = (experiment: MLExperiment) => {
    setSelectedExperiment(experiment);
    setSelectedDataset(null);
    setActiveTab('explain');
    setSummary(null);
    setQuality(null);
    setExplanation(null);
    setInsights([]);
    setQueryResponse(null);
  };

  const loadSummary = async () => {
    if (!selectedDataset) return;
    try {
      const result = await apiClient.getAIDatasetSummary(selectedDataset.id);
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    }
  };

  const loadQuality = async () => {
    if (!selectedDataset) return;
    try {
      const result = await apiClient.getAIDataQuality(selectedDataset.id);
      setQuality(result.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quality explanation');
    }
  };

  const loadExplanation = async () => {
    if (!selectedExperiment) return;
    try {
      const result = await apiClient.getAIMLExplanation(selectedExperiment.id);
      setExplanation(result.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
    }
  };

  const loadInsights = async () => {
    if (!selectedExperiment) return;
    try {
      const result = await apiClient.getAIInsights(selectedExperiment.id);
      setInsights(result.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    }
  };

  const handleQuery = async () => {
    if (!selectedDataset || !question.trim()) return;
    setIsQuerying(true);
    setError(null);
    try {
      const result = await apiClient.queryAI(selectedDataset.id, question.trim());
      setQueryResponse(result.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setIsQuerying(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'summary' && selectedDataset && !summary) loadSummary();
    if (activeTab === 'quality' && selectedDataset && !quality) loadQuality();
    if (activeTab === 'explain' && selectedExperiment && !explanation) loadExplanation();
    if (activeTab === 'insights' && selectedExperiment && insights.length === 0) loadInsights();
  }, [activeTab, selectedDataset, selectedExperiment]);

  if (loading) {
    return <Loading message="Loading AI workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Insights</h2>
        <p className="text-sm text-muted-foreground">Explain your data and models with AI</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Datasets</h3>
            {datasets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No datasets uploaded.</p>
            ) : (
              <div className="space-y-2">
                {datasets.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => handleDatasetSelect(ds)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedDataset?.id === ds.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{ds.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {ds.row_count.toLocaleString()} rows
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Experiments</h3>
            {experiments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No experiments yet.</p>
            ) : (
              <div className="space-y-2">
                {experiments.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleExperimentSelect(exp)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedExperiment?.id === exp.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{exp.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {exp.problem_type?.replace(/_/g, ' ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedDataset ? (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-border">
                <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Summary</TabButton>
                <TabButton active={activeTab === 'quality'} onClick={() => setActiveTab('quality')}>Data Quality</TabButton>
                <TabButton active={activeTab === 'ask'} onClick={() => setActiveTab('ask')}>Ask Your Data</TabButton>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Dataset Summary</h3>
                    {!summary ? (
                      <button onClick={loadSummary} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                        Generate Summary
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-foreground">{summary.summary}</p>
                        {summary.key_characteristics.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Key Characteristics</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {summary.key_characteristics.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.quality_observations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Quality Observations</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {summary.quality_observations.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.limitations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Limitations</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {summary.limitations.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'quality' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Data Quality Explanation</h3>
                    {!quality ? (
                      <button onClick={loadQuality} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                        Generate Explanation
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {quality.detected_issues.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-400">Detected Issues</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {quality.detected_issues.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {quality.potential_issues.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-yellow-400">Potential Issues</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {quality.potential_issues.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {quality.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-400">Recommendations</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {quality.recommendations.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-foreground">{quality.overall_assessment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'ask' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Ask Your Data</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about your data..."
                        className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground"
                        onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                      />
                      <button
                        onClick={handleQuery}
                        disabled={isQuerying || !question.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {isQuerying ? 'Asking...' : 'Ask'}
                      </button>
                    </div>
                    {queryResponse && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-foreground">{queryResponse.answer}</p>
                        </div>
                        {queryResponse.evidence.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Evidence</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {queryResponse.evidence.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {queryResponse.limitations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-yellow-400">Limitations</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {queryResponse.limitations.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : selectedExperiment ? (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-border">
                <TabButton active={activeTab === 'explain'} onClick={() => setActiveTab('explain')}>Explanation</TabButton>
                <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')}>Insights</TabButton>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                {activeTab === 'explain' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Model Explanation</h3>
                    {!explanation ? (
                      <button onClick={loadExplanation} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                        Generate Explanation
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-foreground">{explanation.explanation}</p>
                        {explanation.model_comparison && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Model Comparison</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{explanation.model_comparison}</p>
                          </div>
                        )}
                        {explanation.feature_interpretation && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Feature Interpretation</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{explanation.feature_interpretation}</p>
                          </div>
                        )}
                        {explanation.limitations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-yellow-400">Limitations</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {explanation.limitations.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
                    {insights.length === 0 ? (
                      <button onClick={loadInsights} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                        Generate Insights
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {insights.map((insight, i) => (
                          <div key={i} className="rounded-lg border border-border p-4">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                insight.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                insight.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {insight.severity}
                              </span>
                              <span className="text-xs text-muted-foreground">{insight.confidence} confidence</span>
                            </div>
                            <h4 className="mt-2 font-medium text-foreground">{insight.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{insight.explanation}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{insight.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a dataset or experiment to view AI insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
