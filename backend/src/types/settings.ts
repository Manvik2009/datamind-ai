export interface NotificationChannelPreferences {
  in_app: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  analysis_completed: NotificationChannelPreferences;
  model_training_completed: NotificationChannelPreferences;
  agent_completed: NotificationChannelPreferences;
  report_generated: NotificationChannelPreferences;
  job_failed: NotificationChannelPreferences;
  security_events: NotificationChannelPreferences;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  reduced_motion: boolean;
  compact_density: boolean;
  timezone: string;
  language: string;
  ai_response_style: 'concise' | 'balanced' | 'detailed';
  ai_detail_level: 'basic' | 'standard' | 'advanced';
  ai_explain_results: boolean;
  ai_show_limitations: boolean;
  ai_ask_before_expensive: boolean;
  ai_model_preference?: string;
  notification_preferences: NotificationPreferences;
  analytics_opt_out: boolean;
  activity_visibility: 'private' | 'team';
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name?: string;
  timezone?: string;
  language?: string;
}

export interface AppearanceUpdate {
  theme?: 'light' | 'dark' | 'system';
  reduced_motion?: boolean;
  compact_density?: boolean;
}

export interface AIPreferencesUpdate {
  ai_response_style?: 'concise' | 'balanced' | 'detailed';
  ai_detail_level?: 'basic' | 'standard' | 'advanced';
  ai_explain_results?: boolean;
  ai_show_limitations?: boolean;
  ai_ask_before_expensive?: boolean;
  ai_model_preference?: string;
}

export interface NotificationPreferencesUpdate {
  analysis_completed?: NotificationChannelPreferences;
  model_training_completed?: NotificationChannelPreferences;
  agent_completed?: NotificationChannelPreferences;
  report_generated?: NotificationChannelPreferences;
  job_failed?: NotificationChannelPreferences;
  security_events?: NotificationChannelPreferences;
}

export interface PrivacyUpdate {
  analytics_opt_out?: boolean;
  activity_visibility?: 'private' | 'team';
}

export interface DataSummary {
  datasets: number;
  analyses: number;
  experiments: number;
  ai_analyses: number;
  reports: number;
  predictions: number;
}

export interface IntegrationStatus {
  provider: string;
  connected: boolean;
  last_checked?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface SecurityInfo {
  last_login?: string;
  active_sessions: number;
  two_factor_enabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  analysis_completed: { in_app: true, email: false },
  model_training_completed: { in_app: true, email: false },
  agent_completed: { in_app: true, email: false },
  report_generated: { in_app: true, email: false },
  job_failed: { in_app: true, email: true },
  security_events: { in_app: true, email: true },
};

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme: 'system',
  reduced_motion: false,
  compact_density: false,
  timezone: 'UTC',
  language: 'en',
  ai_response_style: 'balanced',
  ai_detail_level: 'standard',
  ai_explain_results: true,
  ai_show_limitations: true,
  ai_ask_before_expensive: true,
  notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  analytics_opt_out: false,
  activity_visibility: 'private',
};
