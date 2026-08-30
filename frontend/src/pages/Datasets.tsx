import { useState } from 'react';
import { DatasetUpload } from '@/components/DatasetUpload';
import { DatasetList } from '@/components/DatasetList';
import { DatasetDetailView } from '@/components/DatasetDetail';
import { DatasetRecord, DatasetDetail } from '@/types/dataset';

type View = 'list' | 'detail';

export const Datasets = () => {
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [view, setView] = useState<View>('list');
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);

  const handleUploaded = (dataset: DatasetDetail) => {
    setDatasets((prev) => [{
      id: dataset.id,
      filename: dataset.filename,
      original_filename: dataset.original_filename,
      row_count: dataset.row_count,
      column_count: dataset.column_count,
      status: dataset.status,
      uploaded_at: dataset.uploaded_at,
      updated_at: dataset.updated_at,
    }, ...prev]);
    setSelectedDataset(dataset);
    setView('detail');
  };

  const handleSelect = (dataset: DatasetRecord) => {
    setSelectedDataset(dataset as DatasetDetail);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedDataset(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Datasets</h2>
          <p className="text-sm text-muted-foreground">Upload and explore your data</p>
        </div>
        {view === 'detail' && (
          <button
            onClick={handleBack}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Back to list
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          <DatasetUpload onUploaded={handleUploaded} />
          <DatasetList datasets={datasets} onSelect={handleSelect} />
        </div>
      ) : (
        selectedDataset && <DatasetDetailView dataset={selectedDataset} />
      )}
    </div>
  );
};
