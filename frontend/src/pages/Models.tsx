import { useState, useEffect } from 'react';
import { DatasetRecord, DatasetDetail } from '@/types/dataset';
import { MLExperiment } from '@/types/ml';
import { apiClient } from '@/lib/api';
import { Loading } from '@/components/Loading';

type Step = 'select_dataset' | 'configure' | 'training' | 'results';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  RUNNING: 'bg-yellow-500/20 text-yellow-400',
  QUEUED: 'bg-secondary text-muted-foreground',
  CANCELLED: 'bg-secondary text-muted-foreground',
};

export const Models = () => {
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [experiments, setExperiments] = useState<MLExperiment[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);
  const [step, setStep] = useState<Step>('select_dataset');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
    loadExperiments();
  }, []);

  const loadDatasets = async () => {
    try {
      const result = await apiClient.get<DatasetRecord[]>('/datasets');
      setDatasets(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const loadExperiments = async () => {
    try {
      const result = await apiClient.get<MLExperiment[]>('/ml');
      setExperiments(result || []);
    } catch (err) {
      console.error('Failed to load experiments', err);
    }
  };

  const handleDatasetSelect = async (dataset: DatasetRecord) => {
    try {
      const detail = await apiClient.get<DatasetDetail>(`/datasets/${dataset.id}`);
      setSelectedDataset(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset details');
      setSelectedDataset(dataset as DatasetDetail);
    }
    setStep('configure');
  };

  const handleExperimentComplete = (experiment: MLExperiment) => {
    setExperiments((prev) => [experiment, ...prev]);
    setStep('results');
  };

  if (loading) {
    return <Loading message="Loading ML workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Models</h2>
        <p className="text-sm text-muted-foreground">Train and evaluate machine learning models</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {step === 'select_dataset' && (
        <DatasetSelection datasets={datasets} onSelect={handleDatasetSelect} />
      )}

      {step === 'configure' && selectedDataset && (
        <ModelConfiguration
          dataset={selectedDataset}
          onBack={() => setStep('select_dataset')}
          onComplete={handleExperimentComplete}
        />
      )}

      {step === 'results' && (
        <ExperimentResults experiments={experiments} onNewExperiment={() => setStep('select_dataset')} />
      )}
    </div>
  );
};

const DatasetSelection = ({ datasets, onSelect }: { datasets: DatasetRecord[]; onSelect: (d: DatasetRecord) => void }) => {
  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No datasets available. Upload a dataset first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Select a Dataset</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => onSelect(dataset)}
            className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
          >
            <p className="font-medium text-foreground">{dataset.original_filename}</p>
            <p className="text-xs text-muted-foreground">
              {dataset.row_count.toLocaleString()} rows x {dataset.column_count} columns
            </p>
            <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
              {dataset.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ModelConfiguration = ({ dataset, onBack, onComplete }: {
  dataset: DatasetDetail;
  onBack: () => void;
  onComplete: (experiment: MLExperiment) => void;
}) => {
  const [targetColumn, setTargetColumn] = useState('');
  const [problemType, setProblemType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!targetColumn) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/datasets/${dataset.id}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to load dataset');

      const datasetDetail = data.data;
      const detectedTypes: Record<string, string> = {};
      datasetDetail.profile?.columns_detail?.forEach((col: any) => {
        detectedTypes[col.column] = col.detected_type;
      });

      const uniqueValues = datasetDetail.profile?.columns_detail?.find((c: any) => c.column === targetColumn)?.unique_values || 0;
      const dtype = datasetDetail.profile?.columns_detail?.find((c: any) => c.column === targetColumn)?.detected_type || 'unknown';

      let detectedProblem = 'unknown';
      if (dtype === 'boolean') detectedProblem = 'binary_classification';
      else if (dtype === 'categorical') detectedProblem = uniqueValues === 2 ? 'binary_classification' : 'multiclass_classification';
      else if (dtype === 'numeric') detectedProblem = 'regression';

      setProblemType(detectedProblem);
      setAnalysis({
        targetColumn,
        dtype,
        uniqueValues,
        problemType: detectedProblem,
        isCertain: detectedProblem !== 'unknown',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTrain = async () => {
    if (!problemType) return;
    setIsTraining(true);
    setError(null);
    try {
      const experiment = await apiClient.createExperiment(dataset.id, {
        name: `${dataset.original_filename} - ${problemType}`,
        target_column: targetColumn,
        problem_type: problemType,
        test_size: 0.2,
        random_seed: 42,
      });
      onComplete(experiment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configure Model Training</h3>
          <p className="text-sm text-muted-foreground">{dataset.original_filename}</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Target Column</label>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select target column</option>
            {dataset.profile?.columns_detail?.map((col: any) => (
              <option key={col.column} value={col.column}>
                {col.column} ({col.detected_type})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!targetColumn || isAnalyzing}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Target'}
        </button>

        {analysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Data Type</p>
                <p className="text-lg font-semibold text-foreground">{analysis.dtype}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Unique Values</p>
                <p className="text-lg font-semibold text-foreground">{String(analysis.uniqueValues)}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Detected Problem Type</p>
              <p className="text-lg font-semibold text-foreground capitalize">
                {analysis.problemType.replace(/_/g, ' ')}
              </p>
              {!analysis.isCertain && (
                <p className="mt-1 text-xs text-yellow-400">Uncertain - please confirm</p>
              )}
            </div>

            <button
              onClick={handleTrain}
              disabled={isTraining || !problemType}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isTraining ? 'Starting Training...' : 'Start Training'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ExperimentResults = ({ experiments, onNewExperiment }: { experiments: MLExperiment[]; onNewExperiment: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Experiments</h3>
        <button
          onClick={onNewExperiment}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          New Experiment
        </button>
      </div>

      {experiments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No experiments yet. Start training to see results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{exp.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Target: {exp.target_column} - {String(exp.problem_type || 'unknown').replace(/_/g, ' ')}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[exp.status] || STATUS_COLORS.QUEUED}`}>
                  {exp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};