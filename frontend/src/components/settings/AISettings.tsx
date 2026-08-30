import { useState } from 'react';
import { UserSettings } from '@/types/settings';
import { apiClient } from '@/lib/api';

interface AISettingsProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  onSuccess: (message: string) => void;
}

export const AISettings = ({ settings, onUpdate, onSuccess }: AISettingsProps) => {
  const [responseStyle, setResponseStyle] = useState(settings?.ai_response_style ?? 'balanced');
  const [detailLevel, setDetailLevel] = useState(settings?.ai_detail_level ?? 'standard');
  const [explainResults, setExplainResults] = useState(settings?.ai_explain_results ?? true);
  const [showLimitations, setShowLimitations] = useState(settings?.ai_show_limitations ?? true);
  const [askBeforeExpensive, setAskBeforeExpensive] = useState(settings?.ai_ask_before_expensive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.updateAISettings({
        ai_response_style: responseStyle,
        ai_detail_level: detailLevel,
        ai_explain_results: explainResults,
        ai_show_limitations: showLimitations,
        ai_ask_before_expensive: askBeforeExpensive,
      });
      await onUpdate({
        ai_response_style: responseStyle,
        ai_detail_level: detailLevel,
        ai_explain_results: explainResults,
        ai_show_limitations: showLimitations,
        ai_ask_before_expensive: askBeforeExpensive,
      });
      onSuccess('AI preferences saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save AI preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">AI Preferences</h3>
        <p className="text-sm text-muted-foreground">Configure how AI features behave</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Response Style</label>
          <select
            value={responseStyle}
            onChange={(e) => setResponseStyle(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Analysis Detail</label>
          <select
            value={detailLevel}
            onChange={(e) => setDetailLevel(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Explain Calculations</p>
            <p className="text-xs text-muted-foreground">Show how results are computed</p>
          </div>
          <button
            onClick={() => setExplainResults(!explainResults)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              explainResults ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                explainResults ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Show Limitations</p>
            <p className="text-xs text-muted-foreground">Display limitations and caveats</p>
          </div>
          <button
            onClick={() => setShowLimitations(!showLimitations)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              showLimitations ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                showLimitations ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Ask Before Expensive Analysis</p>
            <p className="text-xs text-muted-foreground">Confirm before running large analyses</p>
          </div>
          <button
            onClick={() => setAskBeforeExpensive(!askBeforeExpensive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              askBeforeExpensive ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                askBeforeExpensive ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <p className="text-xs font-medium text-blue-400">AI DATA USAGE</p>
          <p className="text-xs text-muted-foreground mt-1">
            Only information required for the requested AI operation is sent to the configured AI provider.
            Sensitive credentials are never sent to the AI model.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
