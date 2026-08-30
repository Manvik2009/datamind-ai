import { DatasetRecord } from '@/types/dataset';
import { AnalysisSession } from '@/types/analysis';

interface AnalysisHeaderProps {
  dataset: DatasetRecord | null;
  session: AnalysisSession | null;
  saving: boolean;
  onSave: () => void;
  onExport: (format: string) => void;
  onAskAI: () => void;
}

export const AnalysisHeader = ({ dataset, session, saving, onSave, onExport, onAskAI }: AnalysisHeaderProps) => {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analysis Workspace</h2>
          {dataset && (
            <p className="text-xs text-muted-foreground">{dataset.original_filename}</p>
          )}
        </div>
        {dataset && (
          <select
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground"
            value={dataset.id}
            onChange={() => {}}
          >
            <option value={dataset.id}>{dataset.original_filename}</option>
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving || !session}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Analysis'}
        </button>
        <button
          onClick={() => onExport('json')}
          disabled={!session}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          Export
        </button>
        <button
          onClick={onAskAI}
          disabled={!dataset}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Ask AI
        </button>
      </div>
    </div>
  );
};
