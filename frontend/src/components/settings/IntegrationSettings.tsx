import { useState, useEffect } from 'react';
import { IntegrationStatus } from '@/types/settings';
import { apiClient } from '@/lib/api';

export const IntegrationSettings = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getIntegrationStatuses();
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading integrations...</div>;
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
        <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
        <p className="text-sm text-muted-foreground">View connection status for integrated services</p>
      </div>

      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <p className="text-xs text-yellow-400">
          Server-managed integrations are configured by administrators. API keys and credentials are never displayed.
        </p>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.provider} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{integration.provider}</p>
                <p className="text-xs text-muted-foreground">
                  {integration.last_checked
                    ? `Last checked: ${new Date(integration.last_checked).toLocaleString()}`
                    : 'Not checked'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    integration.connected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
                <span
                  className={`text-sm ${
                    integration.connected ? 'text-green-400' : 'text-muted-foreground'
                  }`}
                >
                  {integration.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {integrations.length === 0 && (
        <p className="text-sm text-muted-foreground">No integrations configured.</p>
      )}
    </div>
  );
};
