import { Request, Response } from 'express';
import { SettingsService } from '../services/settingsService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_USER_SETTINGS } from '../types/settings.js';

function getParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return '';
}

function getStringQuery(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function getDefaultSettings() {
  return {
    id: 'default',
    user_id: 'anonymous',
    ...DEFAULT_USER_SETTINGS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse(getDefaultSettings(), req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const settings = await SettingsService.getSettings(userId);
  res.status(200).json(successResponse(settings, req.originalUrl));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    const { display_name, timezone, language } = req.body;
    const updated = getDefaultSettings();
    if (timezone) updated.timezone = timezone;
    if (language) updated.language = language;
    updated.updated_at = new Date().toISOString();
    res.status(200).json(successResponse(updated, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const { display_name, timezone, language } = req.body;

  if (timezone && !isValidTimezone(timezone)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid timezone identifier');
  }

  if (language && !['en'].includes(language)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Unsupported language');
  }

  const settings = await SettingsService.updateProfile(userId, {
    display_name,
    timezone,
    language,
  });
  res.status(200).json(successResponse(settings, req.originalUrl));
});

export const updateAppearance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    const { theme, reduced_motion, compact_density } = req.body;
    const updated = getDefaultSettings();
    if (theme) updated.theme = theme;
    if (reduced_motion !== undefined) updated.reduced_motion = reduced_motion;
    if (compact_density !== undefined) updated.compact_density = compact_density;
    updated.updated_at = new Date().toISOString();
    res.status(200).json(successResponse(updated, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const { theme, reduced_motion, compact_density } = req.body;

  if (theme && !['light', 'dark', 'system'].includes(theme)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid theme value');
  }

  const settings = await SettingsService.updateAppearance(userId, {
    theme,
    reduced_motion,
    compact_density,
  });
  res.status(200).json(successResponse(settings, req.originalUrl));
});

export const updateAIPreferences = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    const updates = req.body;
    const updated = { ...getDefaultSettings(), ...updates };
    updated.updated_at = new Date().toISOString();
    res.status(200).json(successResponse(updated, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const {
    ai_response_style,
    ai_detail_level,
    ai_explain_results,
    ai_show_limitations,
    ai_ask_before_expensive,
    ai_model_preference,
  } = req.body;

  if (ai_response_style && !['concise', 'balanced', 'detailed'].includes(ai_response_style)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid AI response style');
  }

  if (ai_detail_level && !['basic', 'standard', 'advanced'].includes(ai_detail_level)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid AI detail level');
  }

  const settings = await SettingsService.updateAIPreferences(userId, {
    ai_response_style,
    ai_detail_level,
    ai_explain_results,
    ai_show_limitations,
    ai_ask_before_expensive,
    ai_model_preference,
  });
  res.status(200).json(successResponse(settings, req.originalUrl));
});

export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    const preferences = req.body;
    const updated = getDefaultSettings();
    updated.notification_preferences = { ...updated.notification_preferences, ...preferences };
    updated.updated_at = new Date().toISOString();
    res.status(200).json(successResponse(updated, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const preferences = req.body;

  const settings = await SettingsService.updateNotificationPreferences(userId, preferences);
  res.status(200).json(successResponse(settings, req.originalUrl));
});

export const updatePrivacy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    const { analytics_opt_out, activity_visibility } = req.body;
    const updated = getDefaultSettings();
    if (analytics_opt_out !== undefined) updated.analytics_opt_out = analytics_opt_out;
    if (activity_visibility) updated.activity_visibility = activity_visibility;
    updated.updated_at = new Date().toISOString();
    res.status(200).json(successResponse(updated, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const { analytics_opt_out, activity_visibility } = req.body;

  if (activity_visibility && !['private', 'team'].includes(activity_visibility)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid activity visibility value');
  }

  const settings = await SettingsService.updatePrivacy(userId, {
    analytics_opt_out,
    activity_visibility,
  });
  res.status(200).json(successResponse(settings, req.originalUrl));
});

export const getDataSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse({
      datasets: 0,
      analyses: 0,
      experiments: 0,
      ai_analyses: 0,
      reports: 0,
      predictions: 0,
    }, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const summary = await SettingsService.getDataSummary(userId);
  res.status(200).json(successResponse(summary, req.originalUrl));
});

export const getIntegrationStatuses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id || 'anonymous';
  const integrations = await SettingsService.getIntegrationStatuses(userId);
  res.status(200).json(successResponse(integrations, req.originalUrl));
});

export const getSecurityInfo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse({
      last_login: undefined,
      active_sessions: 0,
      two_factor_enabled: false,
    }, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const security = await SettingsService.getSecurityInfo(userId);
  res.status(200).json(successResponse(security, req.originalUrl));
});

export const exportUserData = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse({
      export_date: new Date().toISOString(),
      user_id: 'anonymous',
      data: { datasets: [], experiments: [], analyses: [], insights: [] },
    }, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const exportData = await SettingsService.exportUserData(userId);
  res.status(200).json(successResponse(exportData, req.originalUrl));
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse({ deleted: true }, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const { confirmation } = req.body;

  if (confirmation !== 'DELETE') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Please type DELETE to confirm account deletion');
  }

  const result = await SettingsService.deleteAccount(userId);
  res.status(200).json(successResponse(result, req.originalUrl));
});

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
