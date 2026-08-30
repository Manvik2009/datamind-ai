import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { UserSettings } from '@/types/settings';
import { Loading } from '@/components/Loading';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { AISettings } from '@/components/settings/AISettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { DataSettings } from '@/components/settings/DataSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';

type SettingsCategory = 'profile' | 'appearance' | 'ai' | 'notifications' | 'security' | 'privacy' | 'data' | 'integrations';

type UiState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success'; settings: UserSettings };

const categories: Array<{ id: SettingsCategory; label: string; icon: string }> = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'ai', label: 'AI Preferences', icon: '🤖' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'privacy', label: 'Privacy', icon: '🛡️' },
  { id: 'data', label: 'Data & Storage', icon: '💾' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
];

export const Settings = () => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile');
  const [uiState, setUiState] = useState<UiState>({ type: 'loading' });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    setUiState({ type: 'loading' });

    try {
      const data = await apiClient.getSettings();
      setUiState({ type: 'success', settings: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setUiState({ type: 'error', message });
    }
  };

  const showSuccess = (message: string): void => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUpdateSettings = async (updates: Partial<UserSettings>): Promise<void> => {
    if (uiState.type !== 'success') return;

    try {
      const updated = await apiClient.updateProfileSettings(updates as any);
      setUiState({ type: 'success', settings: updated });
      showSuccess('Settings saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setUiState({ type: 'error', message });
    }
  };

  if (uiState.type === 'loading') {
    return <Loading message="Loading settings..." />;
  }

  if (uiState.type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to load settings</h3>
          <p className="text-sm text-muted-foreground mb-4">{uiState.message}</p>
          <button
            onClick={loadSettings}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const settings = uiState.settings;

  const renderContent = () => {
    switch (activeCategory) {
      case 'profile':
        return <ProfileSettings settings={settings} onUpdate={handleUpdateSettings} />;
      case 'appearance':
        return <AppearanceSettings settings={settings} onUpdate={handleUpdateSettings} onSuccess={showSuccess} />;
      case 'ai':
        return <AISettings settings={settings} onUpdate={handleUpdateSettings} onSuccess={showSuccess} />;
      case 'notifications':
        return <NotificationSettings settings={settings} onUpdate={handleUpdateSettings} onSuccess={showSuccess} />;
      case 'security':
        return <SecuritySettings />;
      case 'privacy':
        return <PrivacySettings settings={settings} onUpdate={handleUpdateSettings} onSuccess={showSuccess} />;
      case 'data':
        return <DataSettings />;
      case 'integrations':
        return <IntegrationSettings />;
      default:
        return <ProfileSettings settings={settings} onUpdate={handleUpdateSettings} />;
    }
  };

  return (
    <div className="flex h-full overflow-hidden animate-fade-in">
      <div className="w-56 flex-shrink-0 overflow-y-auto border-r border-border bg-card">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Settings</h2>
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                  activeCategory === cat.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-secondary hover:translate-x-0.5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {successMessage && (
          <div className="m-4 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-400 animate-slide-up">
            {successMessage}
          </div>
        )}

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
