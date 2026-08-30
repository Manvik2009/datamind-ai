import { useState } from 'react';
import { UserSettings } from '@/types/settings';
import { apiClient } from '@/lib/api';

interface ProfileSettingsProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
}

export const ProfileSettings = ({ settings, onUpdate }: ProfileSettingsProps) => {
  const [timezone, setTimezone] = useState(settings?.timezone ?? 'UTC');
  const [language, setLanguage] = useState(settings?.language ?? 'en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.updateProfileSettings({ timezone, language });
      await onUpdate({ timezone, language });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Profile</h3>
        <p className="text-sm text-muted-foreground">Manage your account profile</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            type="text"
            value="user@example.com"
            disabled
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">Email is managed by your authentication provider</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="en">English</option>
          </select>
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
