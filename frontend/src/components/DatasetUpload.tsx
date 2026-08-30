import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { DatasetDetail } from '@/types/dataset';
import { Loading } from '@/components/Loading';

interface DatasetUploadProps {
  onUploaded: (dataset: DatasetDetail) => void;
}

export const DatasetUpload = ({ onUploaded }: DatasetUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const result = await apiClient.upload<DatasetDetail>('/datasets/upload', file);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploaded]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'
        }`}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onInputChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5h12a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18.75 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-foreground">
            {isUploading ? 'Processing dataset...' : 'Drop a CSV or XLSX file here'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
        </label>
      </div>
      {isUploading && <Loading message="Analyzing dataset..." />}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};
