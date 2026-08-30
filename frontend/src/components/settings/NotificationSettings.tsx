import { useState } from 'react';
import { UserSettings, NotificationPreferences } from '@/types/settings';
import { apiClient } from '@/lib/api';

interface NotificationSettingsProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  onSuccess: (message: string) => void;
}

const notificationCategories = [
  { key: 'analysis_completed', label: 'Analysis Completed' },
  { key: 'model_training_completed', label: 'Model Training Completed' },
  { key: 'agent_completed', label: 'Agent Completed' },
  { key: 'report_generated', label: 'Report Generated' },
  { key: 'job_failed', label: 'Job Failed' },
  { key: 'security_events', label: 'Security Events' },
] as const;

export const NotificationSettings = ({ settings, onUpdate, onSuccess }: NotificationSettingsProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    settings?.notification_preferences ?? {
      analysis_completed: { in_app: true, email: false },
      model_training_completed: { in_app: true, email: false },
      agent_completed: { in_app: true, email: false },
      report_generated: { in_app: true, email: false },
      job_failed: { in_app: true, email: true },
      security_events: { in_app: true, email: true },
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (category: keyof NotificationPreferences, channel: 'in_app' | 'email') => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.updateNotificationSettings(preferences);
      await onUpdate({ notification_preferences: preferences });
      onSuccess('Notification preferences saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="p-3 text-left text-xs font-medium text-foreground">Event</th>
              <th className="p-3 text-center text-xs font-medium text-foreground">In-App</th>
              <th className="p-3 text-center text-xs font-medium text-foreground">Email</th>
            </tr>
          </thead>
          <tbody>
            {notificationCategories.map((cat) => (
              <tr key={cat.key} className="border-b border-border last:border-0">
                <td className="p-3 text-foreground">{cat.label}</td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={preferences[cat.key]?.in_app ?? false}
                    onChange={() => handleToggle(cat.key, 'in_app')}
                    className="rounded border-border"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={preferences[cat.key]?.email ?? false}
                    onChange={() => handleToggle(cat.key, 'email')}
                    className="rounded border-border"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};
