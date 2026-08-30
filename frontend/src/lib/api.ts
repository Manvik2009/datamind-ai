import { ApiResponse } from '@/types/api';
import { ApiError } from '@/lib/errors';
import { MLExperiment, MLModel } from '@/types/ml';
import { DashboardOverview, ActivityItem, JobSummary } from '@/types/dashboard';
import {
  AnalysisSession,
  DatasetOverview,
  ColumnExploration,
  DescriptiveStatistics,
  DistributionAnalysis,
  CorrelationResult,
  CorrelationMatrix,
  OutlierAnalysis,
  MissingDataAnalysis,
  GroupByResult,
  TimeSeriesResult,
  ChartConfiguration,
  ChartResult,
  StatisticalTestResult,
} from '@/types/analysis';
import {
  UserSettings,
  DataSummary,
  IntegrationStatus,
  SecurityInfo,
  NotificationPreferences,
} from '@/types/settings';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let details: unknown = undefined;
    let errorMessage = response.statusText;
    let errorCode = 'HTTP_ERROR';

    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error.message || errorMessage;
        errorCode = data.error.code || errorCode;
        details = data.error.details;
      }
    } catch {
      // Response body is not JSON, use status text
    }

    throw new ApiError(errorCode, errorMessage, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as ApiResponse<T>;
  if (!data.success && data.error) {
    throw new ApiError(
      data.error.code,
      data.error.message,
      response.status,
      data.error.details
    );
  }
  return (data.data as T) ?? (undefined as T);
};

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}${path}`);
    return handleResponse<T>(response);
  },

  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(path: string): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  upload: async <T>(path: string, file: File): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<T>(response);
  },

  setAuthToken: (token: string | null): void => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },

  createExperiment: async (datasetId: string, config: {
    name: string;
    target_column: string;
    problem_type?: string;
    test_size?: number;
    random_seed?: number;
    selected_features?: string[];
    selected_models?: string[];
  }) => {
    return apiClient.post<MLExperiment>('/ml', {
      dataset_id: datasetId,
      ...config,
    });
  },

  getExperiments: (datasetId?: string) => {
    const query = datasetId ? `?dataset_id=${datasetId}` : '';
    return apiClient.get<MLExperiment[]>(`/ml${query}`);
  },

  getExperiment: (id: string) => {
    return apiClient.get<MLExperiment & { models: MLModel[] }>(`/ml/${id}`);
  },

  trainExperiment: (id: string) => {
    return apiClient.post<{ id: string; status: string }>(`/ml/${id}/train`);
  },

  deleteExperiment: (id: string) => {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/ml/${id}`);
  },

  getAIDatasetSummary: (datasetId: string) => {
    return apiClient.post<{ dataset_id: string; summary: any }>(`/ai/datasets/${datasetId}/summary`);
  },

  getAIDataQuality: (datasetId: string) => {
    return apiClient.post<{ dataset_id: string; explanation: any }>(`/ai/datasets/${datasetId}/data-quality`);
  },

  getAIMLExplanation: (experimentId: string) => {
    return apiClient.post<{ experiment_id: string; explanation: any }>(`/ai/experiments/${experimentId}/explain`);
  },

  getAIInsights: (experimentId: string) => {
    return apiClient.post<{ experiment_id: string; insights: any[] }>(`/ai/experiments/${experimentId}/insights`);
  },

  queryAI: (datasetId: string, question: string) => {
    return apiClient.post<{ dataset_id: string; question: string; response: any }>('/ai/query', {
      dataset_id: datasetId,
      question,
    });
  },

  getDashboardOverview: () => {
    return apiClient.get<DashboardOverview>('/dashboard/overview');
  },

  getDashboardActivity: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get<ActivityItem[]>(`/dashboard/activity${query}`);
  },

  getDashboardJobs: () => {
    return apiClient.get<JobSummary[]>('/dashboard/jobs');
  },

  createAnalysisSession: (datasetId: string, title?: string) => {
    return apiClient.post<AnalysisSession>('/analysis', { dataset_id: datasetId, title });
  },

  getAnalysisSessions: () => {
    return apiClient.get<AnalysisSession[]>('/analysis');
  },

  getAnalysisSession: (id: string) => {
    return apiClient.get<AnalysisSession>(`/analysis/${id}`);
  },

  updateAnalysisSession: (id: string, updates: Partial<AnalysisSession>) => {
    return apiClient.patch<AnalysisSession>(`/analysis/${id}`, updates);
  },

  deleteAnalysisSession: (id: string) => {
    return apiClient.delete<{ deleted: boolean }>(`/analysis/${id}`);
  },

  duplicateAnalysisSession: (id: string) => {
    return apiClient.post<AnalysisSession>(`/analysis/${id}/duplicate`);
  },

  getAnalysisDatasetOverview: (datasetId: string) => {
    return apiClient.get<DatasetOverview>(`/analysis/dataset/${datasetId}/overview`);
  },

  exploreAnalysisColumn: (datasetId: string, columnName: string) => {
    return apiClient.get<ColumnExploration>(`/analysis/dataset/${datasetId}/columns/${columnName}`);
  },

  getAnalysisStatistics: (datasetId: string, column: string) => {
    return apiClient.get<DescriptiveStatistics>(`/analysis/dataset/${datasetId}/statistics?column=${encodeURIComponent(column)}`);
  },

  getAnalysisDistribution: (datasetId: string, column: string, bins?: number) => {
    const params = new URLSearchParams({ column });
    if (bins) params.set('bins', bins.toString());
    return apiClient.get<DistributionAnalysis>(`/analysis/dataset/${datasetId}/distribution?${params}`);
  },

  getAnalysisCorrelation: (datasetId: string, columnA: string, columnB: string, method?: string) => {
    const params = new URLSearchParams({ column_a: columnA, column_b: columnB });
    if (method) params.set('method', method);
    return apiClient.get<CorrelationResult>(`/analysis/dataset/${datasetId}/correlation?${params}`);
  },

  getAnalysisCorrelationMatrix: (datasetId: string, method?: string) => {
    const params = method ? `?method=${method}` : '';
    return apiClient.get<CorrelationMatrix>(`/analysis/dataset/${datasetId}/correlation-matrix${params}`);
  },

  getAnalysisOutliers: (datasetId: string, column: string, method?: string) => {
    const params = new URLSearchParams({ column });
    if (method) params.set('method', method);
    return apiClient.get<OutlierAnalysis>(`/analysis/dataset/${datasetId}/outliers?${params}`);
  },

  getAnalysisMissingData: (datasetId: string) => {
    return apiClient.get<MissingDataAnalysis>(`/analysis/dataset/${datasetId}/missing-data`);
  },

  postAnalysisGroupBy: (datasetId: string, groupBy: string, measure: string, aggregation: string) => {
    return apiClient.post<GroupByResult>(`/analysis/dataset/${datasetId}/group-by`, {
      group_by: groupBy,
      measure,
      aggregation,
    });
  },

  postAnalysisTimeSeries: (datasetId: string, dateColumn: string, valueColumn: string, frequency: string, aggregation: string) => {
    return apiClient.post<TimeSeriesResult>(`/analysis/dataset/${datasetId}/time-series`, {
      date_column: dateColumn,
      value_column: valueColumn,
      frequency,
      aggregation,
    });
  },

  postAnalysisChart: (datasetId: string, config: ChartConfiguration) => {
    return apiClient.post<ChartResult>(`/analysis/dataset/${datasetId}/chart`, config);
  },

  postStatisticalTest: (datasetId: string, testType: string, columnA: string, columnB?: string) => {
    return apiClient.post<StatisticalTestResult>(`/analysis/dataset/${datasetId}/statistical-test`, {
      test_type: testType,
      column_a: columnA,
      column_b: columnB,
    });
  },

  exportAnalysis: (id: string, format?: string) => {
    const params = format ? `?format=${format}` : '';
    return apiClient.get<unknown>(`/analysis/${id}/export${params}`);
  },

  getSettings: () => {
    return apiClient.get<UserSettings>('/settings');
  },

  updateProfileSettings: (updates: { timezone?: string; language?: string; display_name?: string }) => {
    return apiClient.patch<UserSettings>('/settings/profile', updates);
  },

  updateAppearanceSettings: (updates: { theme?: string; reduced_motion?: boolean; compact_density?: boolean }) => {
    return apiClient.patch<UserSettings>('/settings/appearance', updates);
  },

  updateAISettings: (updates: Partial<Pick<UserSettings, 'ai_response_style' | 'ai_detail_level' | 'ai_explain_results' | 'ai_show_limitations' | 'ai_ask_before_expensive' | 'ai_model_preference'>>) => {
    return apiClient.patch<UserSettings>('/settings/ai-preferences', updates);
  },

  updateNotificationSettings: (updates: Partial<NotificationPreferences>) => {
    return apiClient.patch<UserSettings>('/settings/notifications', updates);
  },

  updatePrivacySettings: (updates: { analytics_opt_out?: boolean; activity_visibility?: string }) => {
    return apiClient.patch<UserSettings>('/settings/privacy', updates);
  },

  getDataSummary: () => {
    return apiClient.get<DataSummary>('/settings/data/summary');
  },

  getIntegrationStatuses: () => {
    return apiClient.get<IntegrationStatus[]>('/settings/integrations');
  },

  getSecurityInfo: () => {
    return apiClient.get<SecurityInfo>('/settings/security');
  },

  exportUserData: () => {
    return apiClient.post<unknown>('/settings/data/export');
  },

  deleteAccount: (confirmation: string) => {
    return apiClient.post<{ deleted: boolean }>('/settings/account/delete', { confirmation });
  },
};
