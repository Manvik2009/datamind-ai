import { useState } from 'react';
import { UserSettings } from '@/types/settings';
import { apiClient } from '@/lib/api';

interface PrivacySettingsProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  onSuccess: (message: string) => void;
}

export const PrivacySettings = ({ settings, onUpdate, onSuccess }: PrivacySettingsProps) => {
  const [analyticsOptOut, setAnalyticsOptOut] = useState(settings.analytics_opt_out);
  const [activityVisibility, setActivityVisibility] = useState(settings.activity_visibility);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.updatePrivacySettings({
        analytics_opt_out: analyticsOptOut,
        activity_visibility: activityVisibility,
      });
      await onUpdate({
        analytics_opt_out: analyticsOptOut,
        activity_visibility: activityVisibility,
      });
      onSuccess('Privacy settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Privacy</h3>
        <p className="text-sm text-muted-foreground">Manage your privacy preferences</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Analytics Opt-Out</p>
            <p className="text-xs text-muted-foreground">Disable usage analytics collection</p>
          </div>
          <button
            onClick={() => setAnalyticsOptOut(!analyticsOptOut)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              analyticsOptOut ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                analyticsOptOut ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Activity Visibility</label>
          <select
            value={activityVisibility}
            onChange={(e) => setActivityVisibility(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="private">Private</option>
            <option value="team">Team</option>
          </select>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Data Export</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Export all your data in JSON format.
          </p>
          <button
            onClick={async () => {
              try {
                const data = await apiClient.exportUserData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'datamind-data-export.json';
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                setError('Failed to export data');
              }
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
          >
            Export My Data
          </button>
        </div>

        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <h4 className="text-sm font-medium text-red-400 mb-2">Delete Account</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently remove your account and associated user-owned data. This action cannot be undone.
          </p>
          <DeleteAccountButton />
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

function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await apiClient.deleteAccount('DELETE');
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
      >
        Delete Account
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-red-400">Type DELETE to confirm:</p>
      <input
        type="text"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="Type DELETE"
        className="w-full rounded-lg border border-red-500/50 bg-secondary px-3 py-2 text-sm text-foreground"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting || confirmation !== 'DELETE'}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setConfirmation('');
            setError(null);
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
