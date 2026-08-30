import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import {
  UserSettings,
  ProfileUpdate,
  AppearanceUpdate,
  AIPreferencesUpdate,
  NotificationPreferencesUpdate,
  PrivacyUpdate,
  DataSummary,
  IntegrationStatus,
  SecurityInfo,
  DEFAULT_USER_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/settings.js';

export class SettingsService {
  static async getSettings(userId: string): Promise<UserSettings> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return this.createDefaultSettings(userId);
      }
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }
    return data as UserSettings;
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_USER_SETTINGS,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create default settings: ${error.message}`);
    }
    return data as UserSettings;
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<UserSettings> {
    return this.updateSettings(userId, {
      timezone: updates.timezone,
      language: updates.language,
    });
  }

  static async updateAppearance(userId: string, updates: AppearanceUpdate): Promise<UserSettings> {
    return this.updateSettings(userId, {
      theme: updates.theme,
      reduced_motion: updates.reduced_motion,
      compact_density: updates.compact_density,
    });
  }

  static async updateAIPreferences(userId: string, updates: AIPreferencesUpdate): Promise<UserSettings> {
    return this.updateSettings(userId, {
      ai_response_style: updates.ai_response_style,
      ai_detail_level: updates.ai_detail_level,
      ai_explain_results: updates.ai_explain_results,
      ai_show_limitations: updates.ai_show_limitations,
      ai_ask_before_expensive: updates.ai_ask_before_expensive,
      ai_model_preference: updates.ai_model_preference,
    });
  }

  static async updateNotificationPreferences(userId: string, updates: NotificationPreferencesUpdate): Promise<UserSettings> {
    const current = await this.getSettings(userId);
    const merged = {
      ...current.notification_preferences,
      ...updates,
    };
    return this.updateSettings(userId, { notification_preferences: merged });
  }

  static async updatePrivacy(userId: string, updates: PrivacyUpdate): Promise<UserSettings> {
    return this.updateSettings(userId, {
      analytics_opt_out: updates.analytics_opt_out,
      activity_visibility: updates.activity_visibility,
    });
  }

  static async getDataSummary(userId: string): Promise<DataSummary> {
    const supabase = getSupabase();

    const [
      { count: datasets },
      { count: analyses },
      { count: experiments },
      { count: aiAnalyses },
      { count: reports },
      { count: predictions },
    ] = await Promise.all([
      supabase.from('datasets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('analysis_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ml_experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ai_analyses').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('decision_reports').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('decision_predictions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    return {
      datasets: datasets || 0,
      analyses: analyses || 0,
      experiments: experiments || 0,
      ai_analyses: aiAnalyses || 0,
      reports: reports || 0,
      predictions: predictions || 0,
    };
  }

  static async getIntegrationStatuses(userId: string): Promise<IntegrationStatus[]> {
    const env = process.env;
    const integrations: IntegrationStatus[] = [];

    integrations.push({
      provider: 'AI Provider',
      connected: !!(env.AI_API_KEY && env.AI_API_KEY.length > 0),
      status: !!(env.AI_API_KEY && env.AI_API_KEY.length > 0) ? 'connected' : 'disconnected',
      last_checked: new Date().toISOString(),
    });

    integrations.push({
      provider: 'Supabase',
      connected: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      status: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) ? 'connected' : 'disconnected',
      last_checked: new Date().toISOString(),
    });

    return integrations;
  }

  static async getSecurityInfo(userId: string): Promise<SecurityInfo> {
    const supabase = getSupabase();
    const { data: userData, error } = await supabase
      .from('users')
      .select('last_login_at')
      .eq('id', userId)
      .single();

    return {
      last_login: userData?.last_login_at || undefined,
      active_sessions: 1,
      two_factor_enabled: false,
    };
  }

  static async exportUserData(userId: string): Promise<unknown> {
    const supabase = getSupabase();

    const [datasets, experiments, analyses, insights] = await Promise.all([
      supabase.from('datasets').select('*').eq('user_id', userId),
      supabase.from('ml_experiments').select('*').eq('user_id', userId),
      supabase.from('analysis_sessions').select('*').eq('user_id', userId),
      supabase.from('ai_insights').select('*').eq('user_id', userId),
    ]);

    return {
      export_date: new Date().toISOString(),
      user_id: userId,
      data: {
        datasets: datasets.data || [],
        experiments: experiments.data || [],
        analyses: analyses.data || [],
        insights: insights.data || [],
      },
    };
  }

  static async deleteAccount(userId: string): Promise<{ deleted: boolean }> {
    const supabase = getSupabase();

    await supabase.from('analysis_sessions').delete().eq('user_id', userId);
    await supabase.from('saved_visualizations').delete().eq('user_id', userId);
    await supabase.from('analysis_notes').delete().eq('user_id', userId);
    await supabase.from('analysis_insights').delete().eq('user_id', userId);
    await supabase.from('decision_predictions').delete().eq('user_id', userId);
    await supabase.from('decision_scenarios').delete().eq('user_id', userId);
    await supabase.from('decision_recommendations').delete().eq('user_id', userId);
    await supabase.from('decision_reports').delete().eq('user_id', userId);
    await supabase.from('decision_history').delete().eq('user_id', userId);
    await supabase.from('decision_jobs').delete().eq('user_id', userId);
    await supabase.from('ml_predictions').delete().eq('user_id', userId);
    await supabase.from('ml_models').delete().eq('user_id', userId);
    await supabase.from('ml_experiments').delete().eq('user_id', userId);
    await supabase.from('ai_analyses').delete().eq('user_id', userId);
    await supabase.from('ai_insights').delete().eq('user_id', userId);
    await supabase.from('ai_queries').delete().eq('user_id', userId);
    await supabase.from('datasets').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);

    return { deleted: true };
  }

  private static async updateSettings(userId: string, updates: Record<string, unknown>): Promise<UserSettings> {
    const supabase = getSupabase();

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update(cleanUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
    return data as UserSettings;
  }
}
