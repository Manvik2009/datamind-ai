import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { DatasetRecord } from '@/types/dataset';
import { AnalysisSession, DatasetOverview } from '@/types/analysis';
import { Loading } from '@/components/Loading';
import { AnalysisToolsPanel } from '@/components/analysis/AnalysisToolsPanel';
import { AnalysisCanvas } from '@/components/analysis/AnalysisCanvas';
import { AnalysisInsightsPanel } from '@/components/analysis/AnalysisInsightsPanel';
import { AnalysisHeader } from '@/components/analysis/AnalysisHeader';

type AnalysisTab = 'overview' | 'columns' | 'statistics' | 'distribution' | 'correlation' | 'outliers' | 'missing' | 'charts' | 'groupby' | 'timeseries';

export const Analysis = () => {
  const { datasetId: paramDatasetId } = useParams<{ datasetId?: string }>();

  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetRecord | null>(null);
  const [analysisSession, setAnalysisSession] = useState<AnalysisSession | null>(null);
  const [datasetOverview, setDatasetOverview] = useState<DatasetOverview | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (paramDatasetId) {
      const dataset = datasets.find((d) => d.id === paramDatasetId);
      if (dataset) {
        handleDatasetSelect(dataset);
      }
    }
  }, [paramDatasetId, datasets]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<DatasetRecord[]>('/datasets');
      setDatasets(data || []);
      if (data && data.length > 0 && !paramDatasetId) {
        handleDatasetSelect(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = async (dataset: DatasetRecord) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedDataset(dataset);

      const overview = await apiClient.getAnalysisDatasetOverview(dataset.id);
      setDatasetOverview(overview);

      const session = await apiClient.createAnalysisSession(dataset.id, `Analysis: ${dataset.original_filename}`);
      setAnalysisSession(session);

      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnalysis = useCallback(async () => {
    if (!analysisSession) return;
    try {
      setSaving(true);
      await apiClient.updateAnalysisSession(analysisSession.id, {
        title: analysisSession.title,
        status: 'ACTIVE',
      });
    } catch (err) {
      console.error('Failed to save analysis:', err);
    } finally {
      setSaving(false);
    }
  }, [analysisSession]);

  const handleExport = useCallback(async (format: string) => {
    if (!analysisSession) return;
    try {
      const result = await apiClient.exportAnalysis(analysisSession.id, format);
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisSession.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export analysis:', err);
    }
  }, [analysisSession]);

  if (loading && !selectedDataset) {
    return <Loading message="Loading analysis workspace..." />;
  }

  if (error && !selectedDataset) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={loadDatasets}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <AnalysisHeader
        dataset={selectedDataset}
        session={analysisSession}
        saving={saving}
        onSave={handleSaveAnalysis}
        onExport={handleExport}
        onAskAI={() => setActiveTab('overview')}
      />

      <div className="flex flex-1 overflow-hidden">
        <AnalysisToolsPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          datasetOverview={datasetOverview}
        />

        <AnalysisCanvas
          activeTab={activeTab}
          dataset={selectedDataset}
          session={analysisSession}
          datasetOverview={datasetOverview}
          loading={loading}
          error={error}
          onRetry={loadDatasets}
        />

        <AnalysisInsightsPanel
          dataset={selectedDataset}
          session={analysisSession}
        />
      </div>
    </div>
  );
};
