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
