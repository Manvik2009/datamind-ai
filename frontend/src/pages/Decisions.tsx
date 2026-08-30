import { useState, useEffect } from 'react';
import { DatasetRecord } from '@/types/dataset';
import { MLExperiment, MLModel } from '@/types/ml';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

type Tab = 'predict' | 'whatif' | 'scenarios' | 'sensitivity' | 'factors' | 'recommendations' | 'report';

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

interface PredictionResult {
  prediction: { value: unknown; target_column?: string };
  probability?: Record<string, number>;
  feature_contributions?: Record<string, number>;
}

interface ScenarioResult {
  id: string;
  scenario_name?: string;
  baseline_input: Record<string, unknown>;
  scenario_input: Record<string, unknown>;
  baseline_prediction: Record<string, unknown>;
  scenario_prediction: Record<string, unknown>;
  difference: Record<string, unknown>;
}

interface SensitivityResult {
  id: string;
  feature_name: string;
  values: unknown[];
  predictions: unknown[];
}

interface DecisionFactor {
  factor: string;
  importance: number;
  direction: string;
  evidence_source: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  evidence: unknown[];
  impact_area: string;
  confidence: string;
  limitations: unknown[];
}

export const Decisions = () => {
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [experiments, setExperiments] = useState<MLExperiment[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetRecord | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<MLExperiment | null>(null);
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('predict');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [featureValues, setFeatureValues] = useState<Record<string, string>>({});
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [explanation, setExplanation] = useState<any>(null);

  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({});
  const [scenarioValues, setScenarioValues] = useState<Record<string, string>>({});
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioName, setScenarioName] = useState('');

  const [savedScenarios, setSavedScenarios] = useState<ScenarioResult[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const [sensitivityFeature, setSensitivityFeature] = useState('');
  const [sensitivityValues, setSensitivityValues] = useState('');
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityResult | null>(null);

  const [factors, setFactors] = useState<DecisionFactor[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reportContent, setReportContent] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      loadModels(selectedExperiment.id);
    }
  }, [selectedExperiment]);

  useEffect(() => {
    if (selectedModel && selectedExperiment) {
      const features = selectedExperiment.selected_features || [];
      const initialValues: Record<string, string> = {};
      features.forEach((f) => {
        initialValues[f] = '';
      });
      setFeatureValues(initialValues);
      setBaselineValues(initialValues);
      setScenarioValues(initialValues);
    }
  }, [selectedModel, selectedExperiment]);

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

  const loadModels = async (experimentId: string) => {
    try {
      const experiment = await apiClient.get<MLExperiment & { models: MLModel[] }>(`/ml/${experimentId}`);
      setModels(experiment.models || []);
      if (experiment.models && experiment.models.length > 0) {
        setSelectedModel(experiment.models[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    }
  };

  const handleDatasetSelect = async (dataset: DatasetRecord) => {
    setSelectedDataset(dataset);
    setError(null);
  };

  const handleExperimentSelect = (experiment: MLExperiment) => {
    setSelectedExperiment(experiment);
    setSelectedDataset(datasets.find((d) => d.id === experiment.dataset_id) || null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!selectedDataset || !selectedExperiment || !selectedModel) return;

    const parsedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(featureValues)) {
      const num = Number(value);
      parsedValues[key] = value === '' ? 0 : isNaN(num) ? value : num;
    }

    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<PredictionResult>('/decisions/predict', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
        model_id: selectedModel.id,
        input_data: parsedValues,
      });
      setPredictionResult(result);
      setExplanation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExplainPrediction = async () => {
    if (!selectedDataset || !selectedExperiment || !selectedModel) return;

    const parsedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(featureValues)) {
      const num = Number(value);
      parsedValues[key] = value === '' ? 0 : isNaN(num) ? value : num;
    }

    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<any>('/ai/decisions/explain', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
        model_id: selectedModel.id,
        input_data: parsedValues,
      });
      setPredictionResult(result);
      setExplanation(result.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Explanation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunScenario = async () => {
    if (!selectedDataset || !selectedExperiment || !selectedModel) return;

    const parseValues = (values: Record<string, string>) => {
      const parsed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        const num = Number(value);
        parsed[key] = value === '' ? 0 : isNaN(num) ? value : num;
      }
      return parsed;
    };

    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<ScenarioResult>('/decisions/scenarios', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
        model_id: selectedModel.id,
        baseline_input: parseValues(baselineValues),
        scenario_input: parseValues(scenarioValues),
        scenario_name: scenarioName || 'Scenario',
      });
      setScenarioResult(result);
      loadScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario failed');
    } finally {
      setActionLoading(false);
    }
  };

  const loadScenarios = async () => {
    if (!selectedDataset || !selectedExperiment) return;
    try {
      const result = await apiClient.get<ScenarioResult[]>(
        `/decisions/scenarios?dataset_id=${selectedDataset.id}&experiment_id=${selectedExperiment.id}`
      );
      setSavedScenarios(result || []);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  };

  const handleCompareScenarios = async () => {
    if (!selectedDataset || !selectedExperiment || !selectedModel || selectedScenarios.length < 2) return;

    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<any>('/decisions/scenarios/compare', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
        model_id: selectedModel.id,
        scenario_ids: selectedScenarios,
      });
      setComparisonResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSensitivityAnalysis = async () => {
    if (!selectedDataset || !selectedExperiment || !selectedModel || !sensitivityFeature) return;

    const values = sensitivityValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '')
      .map((v) => {
        const num = Number(v);
        return isNaN(num) ? v : num;
      });

    if (values.length === 0) {
      setError('Please provide at least one value for sensitivity analysis');
      return;
    }

    const baseInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(baselineValues)) {
      if (key !== sensitivityFeature) {
        const num = Number(value);
        baseInput[key] = value === '' ? 0 : isNaN(num) ? value : num;
      }
    }

    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<SensitivityResult>('/decisions/sensitivity', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
        model_id: selectedModel.id,
        feature_name: sensitivityFeature,
        base_input: baseInput,
        values,
      });
      setSensitivityResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sensitivity analysis failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadFactors = async () => {
    if (!selectedExperiment) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ factors: DecisionFactor[] }>(
        `/decisions/factors/${selectedExperiment.id}`
      );
      setFactors(result.factors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load factors');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!selectedDataset || !selectedExperiment) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<any>('/ai/decisions/recommendations', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
      });
      setRecommendations(result.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedDataset || !selectedExperiment) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<any>('/ai/decisions/report', {
        dataset_id: selectedDataset.id,
        experiment_id: selectedExperiment.id,
      });
      setReportContent(result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'scenarios' && selectedDataset && selectedExperiment) {
      loadScenarios();
    }
    if (activeTab === 'factors' && selectedExperiment && factors.length === 0) {
      handleLoadFactors();
    }
  }, [activeTab, selectedDataset, selectedExperiment]);

  if (loading) {
    return <Loading message="Loading Decision Intelligence..." />;
  }

  const availableFeatures = selectedExperiment?.selected_features || (selectedModel ? Object.keys(selectedModel.feature_importance || {}) : []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Decision Intelligence</h2>
        <p className="text-sm text-muted-foreground">Predictions, what-if scenarios, and decision analysis</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Datasets</h3>
            {datasets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No datasets uploaded.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {datasets.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => handleDatasetSelect(ds)}
                    className={`w-full rounded-lg border p-2 text-left transition-colors ${
                      selectedDataset?.id === ds.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground truncate">{ds.original_filename}</p>
                    <p className="text-xs text-muted-foreground">{ds.row_count.toLocaleString()} rows</p>
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {experiments.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleExperimentSelect(exp)}
                    className={`w-full rounded-lg border p-2 text-left transition-colors ${
                      selectedExperiment?.id === exp.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground truncate">{exp.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{exp.status}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {models.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Models</h3>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full rounded-lg border p-2 text-left transition-colors ${
                      selectedModel?.id === model.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground">{model.model_type}</p>
                    <p className="text-xs text-muted-foreground">v{model.version}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedDataset && selectedExperiment && selectedModel ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1 border-b border-border">
                <TabButton active={activeTab === 'predict'} onClick={() => setActiveTab('predict')}>Predict</TabButton>
                <TabButton active={activeTab === 'whatif'} onClick={() => setActiveTab('whatif')}>What-If</TabButton>
                <TabButton active={activeTab === 'scenarios'} onClick={() => setActiveTab('scenarios')}>Scenarios</TabButton>
                <TabButton active={activeTab === 'sensitivity'} onClick={() => setActiveTab('sensitivity')}>Sensitivity</TabButton>
                <TabButton active={activeTab === 'factors'} onClick={() => setActiveTab('factors')}>Factors</TabButton>
                <TabButton active={activeTab === 'recommendations'} onClick={() => setActiveTab('recommendations')}>Recommendations</TabButton>
                <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')}>Report</TabButton>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                {activeTab === 'predict' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Prediction Center</h3>
                    <p className="text-xs text-muted-foreground">
                      Model: {selectedModel.model_type} | Target: {selectedExperiment.target_column}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {availableFeatures.map((feature) => (
                        <div key={feature}>
                          <label className="block text-xs font-medium text-foreground mb-1">{feature}</label>
                          <input
                            type="text"
                            value={featureValues[feature] || ''}
                            onChange={(e) => setFeatureValues({ ...featureValues, [feature]: e.target.value })}
                            placeholder={`Enter ${feature}`}
                            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handlePredict}
                        disabled={actionLoading}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {actionLoading ? 'Running...' : 'Run Prediction'}
                      </button>
                      <button
                        onClick={handleExplainPrediction}
                        disabled={actionLoading}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                      >
                        Explain Prediction
                      </button>
                    </div>

                    {predictionResult && (
                      <div className="space-y-4 mt-4">
                        <div className="rounded-lg border border-border p-4 bg-secondary/50">
                          <h4 className="text-sm font-medium text-foreground mb-2">Prediction Result</h4>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Predicted Value</p>
                              <p className="text-lg font-semibold text-foreground">
                                {String(predictionResult.prediction?.value)}
                              </p>
                            </div>
                            {predictionResult.probability && Object.keys(predictionResult.probability).length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground">Probabilities</p>
                                <div className="space-y-1">
                                  {Object.entries(predictionResult.probability).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{key}:</span>
                                      <span className="text-foreground font-medium">{((value as number) * 100).toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {predictionResult.feature_contributions && Object.keys(predictionResult.feature_contributions).length > 0 && (
                          <div className="rounded-lg border border-border p-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">Feature Contributions</h4>
                            <div className="space-y-2">
                              {Object.entries(predictionResult.feature_contributions)
                                .sort(([, a], [, b]) => b - a)
                                .map(([feature, importance]) => (
                                  <div key={feature} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-32 truncate">{feature}</span>
                                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${Math.min(100, (importance as number) * 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-foreground w-12 text-right">
                                      {((importance as number) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {explanation && (
                          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                            <h4 className="text-sm font-medium text-blue-400 mb-2">AI Explanation</h4>
                            <p className="text-sm text-foreground">{explanation.explanation}</p>
                            {explanation.disclaimers && explanation.disclaimers.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-blue-500/20">
                                <p className="text-xs text-yellow-400 font-medium">Disclaimers:</p>
                                <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground">
                                  {explanation.disclaimers.map((d: string, i: number) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground italic">
                          This is a model prediction, not a guaranteed outcome.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'whatif' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">What-If Simulator</h3>
                    <p className="text-xs text-muted-foreground">
                      Compare baseline values with modified scenarios
                    </p>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Baseline</h4>
                        {availableFeatures.map((feature) => (
                          <div key={`base-${feature}`}>
                            <label className="block text-xs text-muted-foreground mb-1">{feature}</label>
                            <input
                              type="text"
                              value={baselineValues[feature] || ''}
                              onChange={(e) => setBaselineValues({ ...baselineValues, [feature]: e.target.value })}
                              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Scenario</h4>
                        {availableFeatures.map((feature) => (
                          <div key={`scen-${feature}`}>
                            <label className="block text-xs text-muted-foreground mb-1">{feature}</label>
                            <input
                              type="text"
                              value={scenarioValues[feature] || ''}
                              onChange={(e) => setScenarioValues({ ...scenarioValues, [feature]: e.target.value })}
                              className="w-full rounded-lg border border-primary/50 bg-secondary px-3 py-2 text-sm text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Scenario Name (optional)</label>
                      <input
                        type="text"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        placeholder="e.g., Reduced monthly charges"
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <button
                      onClick={handleRunScenario}
                      disabled={actionLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {actionLoading ? 'Running...' : 'Compare Scenarios'}
                    </button>

                    {scenarioResult && (
                      <div className="space-y-4 mt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-muted-foreground">Baseline</p>
                            <p className="text-lg font-semibold text-foreground">
                              {String(scenarioResult.baseline_prediction?.value)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-primary/50 p-4 bg-primary/5">
                            <p className="text-xs text-muted-foreground">Scenario</p>
                            <p className="text-lg font-semibold text-foreground">
                              {String(scenarioResult.scenario_prediction?.value)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-muted-foreground">Difference</p>
                            <p className="text-lg font-semibold text-foreground">
                              {scenarioResult.difference?.value !== undefined
                                ? String(scenarioResult.difference.value)
                                : JSON.stringify(scenarioResult.difference)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-400">
                            Model-based scenario — not causal evidence. This shows what the model predicts under different inputs,
                            not what will happen in the real world.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'scenarios' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Scenario Comparison</h3>
                    <p className="text-xs text-muted-foreground">
                      Compare multiple saved scenarios side by side
                    </p>

                    {savedScenarios.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No scenarios saved yet. Create one in the What-If tab.</p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {savedScenarios.map((scenario) => (
                            <label
                              key={scenario.id}
                              className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedScenarios.includes(scenario.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedScenarios([...selectedScenarios, scenario.id]);
                                  } else {
                                    setSelectedScenarios(selectedScenarios.filter((id) => id !== scenario.id));
                                  }
                                }}
                                className="rounded border-border"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{scenario.scenario_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Baseline: {String(scenario.baseline_prediction?.value)} → Scenario: {String(scenario.scenario_prediction?.value)}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>

                        <button
                          onClick={handleCompareScenarios}
                          disabled={actionLoading || selectedScenarios.length < 2}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                          Compare Selected ({selectedScenarios.length})
                        </button>

                        {comparisonResult && (
                          <div className="mt-4 rounded-lg border border-border p-4">
                            <h4 className="text-sm font-medium text-foreground mb-3">Comparison Results</h4>
                            <div className="space-y-2">
                              {comparisonResult.comparison_results?.scenarios?.map((s: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                  <span className="text-sm text-foreground">{s.name}</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {String(s.prediction?.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 italic">
                              Model-based scenarios — not guaranteed outcomes.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'sensitivity' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Sensitivity Analysis</h3>
                    <p className="text-xs text-muted-foreground">
                      Analyze how changing a single feature affects predictions
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Feature to Analyze</label>
                        <select
                          value={sensitivityFeature}
                          onChange={(e) => setSensitivityFeature(e.target.value)}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                        >
                          <option value="">Select a feature</option>
                          {availableFeatures.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Values (comma-separated)</label>
                        <input
                          type="text"
                          value={sensitivityValues}
                          onChange={(e) => setSensitivityValues(e.target.value)}
                          placeholder="e.g., 100, 150, 200, 250"
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSensitivityAnalysis}
                      disabled={actionLoading || !sensitivityFeature}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {actionLoading ? 'Running...' : 'Run Analysis'}
                    </button>

                    {sensitivityResult && (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-lg border border-border p-4">
                          <h4 className="text-sm font-medium text-foreground mb-3">
                            Feature: {sensitivityResult.feature_name}
                          </h4>
                          <div className="space-y-2">
                            {sensitivityResult.values.map((val, i) => {
                                  const pred = sensitivityResult.predictions[i] as Record<string, any>;
                                  return (
                                    <div key={i} className="flex items-center gap-3">
                                      <span className="text-sm text-muted-foreground w-20">{String(val)}</span>
                                      <div className="flex-1 h-6 bg-secondary rounded overflow-hidden relative">
                                        <div
                                          className="h-full bg-primary/70 rounded"
                                          style={{
                                            width: `${Math.min(100, Number(pred?.probability?.value || pred?.prediction?.value || 0) * 100)}%`,
                                          }}
                                        />
                                        <span className="absolute inset-0 flex items-center px-2 text-xs text-foreground">
                                          {pred?.probability
                                            ? `${(Object.values(pred.probability)[0] as number * 100).toFixed(0)}%`
                                            : String(pred?.prediction?.value)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                          </div>
                        </div>

                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-400 font-medium">
                            MODEL RESPONSE — NOT CAUSAL ANALYSIS
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This shows how the model responds to different input values. It does not establish
                            that changing this feature will cause the predicted outcome in the real world.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'factors' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Decision Factors</h3>
                    <p className="text-xs text-muted-foreground">
                      Features ranked by their importance in the model
                    </p>

                    {factors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No feature importance data available.</p>
                    ) : (
                      <div className="space-y-3">
                        {factors.map((factor, i) => (
                          <div key={i} className="rounded-lg border border-border p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">{factor.factor}</span>
                              <span className="text-xs text-muted-foreground">{factor.evidence_source}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${factor.importance * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-foreground w-16 text-right">
                                {(factor.importance * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Direction: {factor.direction}
                            </p>
                          </div>
                        ))}

                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 mt-4">
                          <p className="text-xs text-blue-400">
                            Feature importance indicates which features the model uses most heavily for predictions.
                            This does not imply causation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
                    <p className="text-xs text-muted-foreground">
                      Evidence-based recommendations from AI analysis
                    </p>

                    <button
                      onClick={handleGenerateRecommendations}
                      disabled={actionLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {actionLoading ? 'Generating...' : 'Generate Recommendations'}
                    </button>

                    {recommendations.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {recommendations.map((rec, i) => (
                          <div key={i} className="rounded-lg border border-border p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                rec.impact_area === 'data_quality' ? 'bg-blue-500/20 text-blue-400' :
                                rec.impact_area === 'model_quality' ? 'bg-purple-500/20 text-purple-400' :
                                rec.impact_area === 'customer_segment' ? 'bg-green-500/20 text-green-400' :
                                rec.impact_area === 'operations' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {rec.impact_area.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">{rec.confidence} confidence</span>
                            </div>
                            <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                            {rec.evidence && rec.evidence.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-foreground">Evidence:</p>
                                <ul className="list-disc list-inside text-xs text-muted-foreground">
                                  {rec.evidence.map((e, j) => (
                                    <li key={j}>{String(e)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {rec.limitations && rec.limitations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-yellow-400">Limitations:</p>
                                <ul className="list-disc list-inside text-xs text-muted-foreground">
                                  {rec.limitations.map((l, j) => (
                                    <li key={j}>{String(l)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-400">
                            Recommendations are based on model evidence and should be validated before implementation.
                            They are not guaranteed to produce specific outcomes.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'report' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Decision Report</h3>
                    <p className="text-xs text-muted-foreground">
                      Comprehensive report with findings, scenarios, and recommendations
                    </p>

                    <button
                      onClick={handleGenerateReport}
                      disabled={actionLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {actionLoading ? 'Generating...' : 'Generate Report'}
                    </button>

                    {reportContent && (
                      <div className="mt-4 space-y-4">
                        {reportContent.executive_summary && (
                          <div className="rounded-lg border border-border p-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">Executive Summary</h4>
                            <p className="text-sm text-muted-foreground">{reportContent.executive_summary}</p>
                          </div>
                        )}
                        {reportContent.key_findings && reportContent.key_findings.length > 0 && (
                          <div className="rounded-lg border border-border p-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">Key Findings</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {reportContent.key_findings.map((f: string, i: number) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {reportContent.recommendations && reportContent.recommendations.length > 0 && (
                          <div className="rounded-lg border border-border p-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">Recommendations</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {reportContent.recommendations.map((r: string, i: number) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {reportContent.limitations && reportContent.limitations.length > 0 && (
                          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                            <h4 className="text-sm font-medium text-yellow-400 mb-2">Limitations</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {reportContent.limitations.map((l: string, i: number) => (
                                <li key={i}>{l}</li>
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
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a dataset and experiment to use Decision Intelligence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
