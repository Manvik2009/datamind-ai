import { useState } from 'react';
import { UserSettings } from '@/types/settings';
import { apiClient } from '@/lib/api';

interface AppearanceSettingsProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  onSuccess: (message: string) => void;
}

export const AppearanceSettings = ({ settings, onUpdate, onSuccess }: AppearanceSettingsProps) => {
  const [theme, setTheme] = useState(settings?.theme ?? 'system');
  const [reducedMotion, setReducedMotion] = useState(settings?.reduced_motion ?? false);
  const [compactDensity, setCompactDensity] = useState(settings?.compact_density ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.updateAppearanceSettings({
        theme,
        reduced_motion: reducedMotion,
        compact_density: compactDensity,
      });
      await onUpdate({ theme, reduced_motion: reducedMotion, compact_density: compactDensity });
      onSuccess('Appearance settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appearance settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize the look and feel</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm capitalize transition-colors ${
                  theme === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Reduced Motion</p>
            <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
          </div>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              reducedMotion ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                reducedMotion ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Compact Density</p>
            <p className="text-xs text-muted-foreground">Use more compact spacing</p>
          </div>
          <button
            onClick={() => setCompactDensity(!compactDensity)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              compactDensity ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                compactDensity ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
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
