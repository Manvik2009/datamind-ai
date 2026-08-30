import { useState, useEffect } from 'react';
import { SecurityInfo } from '@/types/settings';
import { apiClient } from '@/lib/api';

export const SecuritySettings = () => {
  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityInfo();
  }, []);

  const loadSecurityInfo = async () => {
    try {
      setLoading(true);
      const info = await apiClient.getSecurityInfo();
      setSecurity(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security info');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading security info...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Security</h3>
        <p className="text-sm text-muted-foreground">Manage your account security</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Account Security</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Login</span>
              <span className="text-sm text-foreground">
                {security?.last_login
                  ? new Date(security.last_login).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <span className="text-sm text-foreground">{security?.active_sessions ?? 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Two-Factor Auth</span>
              <span className="text-sm text-foreground">
                {security?.two_factor_enabled ? 'Enabled' : 'Not enabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Password</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Password management is handled by your authentication provider.
          </p>
          <button
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
            onClick={() => {}}
          >
            Change Password
          </button>
        </div>

        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <h4 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Sign out from all devices and sessions.
          </p>
          <button
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
            onClick={() => {}}
          >
            Sign Out All Sessions
          </button>
        </div>
      </div>
    </div>
  );
};
