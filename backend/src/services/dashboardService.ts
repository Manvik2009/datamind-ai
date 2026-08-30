import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export interface DashboardSummary {
  datasets: number;
  analyses: number;
  experiments: number;
  completedExperiments: number;
  insights: number;
  predictions: number;
  reports: number;
  activeJobs: number;
}

export interface DatasetSummary {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  qualityScore: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  modelType: string;
  status: string;
  primaryMetric: string | null;
  primaryMetricValue: number | null;
  targetColumn: string;
  createdAt: string;
}

export interface InsightSummary {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  confidence: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface JobSummary {
  id: string;
  jobType: string;
  status: string;
  progress: number;
  createdAt: string;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  recentDatasets: DatasetSummary[];
  recentExperiments: ExperimentSummary[];
  recentInsights: InsightSummary[];
  recentActivity: ActivityItem[];
  activeJobs: JobSummary[];
}

export class DashboardService {
  static async getOverview(userId: string): Promise<DashboardOverview> {
    const [summary, recentDatasets, recentExperiments, recentInsights, recentActivity, activeJobs] = await Promise.all([
      this.getSummary(userId),
      this.getRecentDatasets(userId),
      this.getRecentExperiments(userId),
      this.getRecentInsights(userId),
      this.getRecentActivity(userId, 10),
      this.getActiveJobs(userId),
    ]);

    return {
      summary,
      recentDatasets,
      recentExperiments,
      recentInsights,
      recentActivity,
      activeJobs,
    };
  }

  static async getSummary(userId: string): Promise<DashboardSummary> {
    const supabase = getSupabase();

    const [
      { count: datasets },
      { count: experiments },
      { count: completedExperiments },
      { count: insights },
      { count: predictions },
      { count: reports },
      { count: activeJobs },
    ] = await Promise.all([
      supabase.from('datasets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ml_experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ml_experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'COMPLETED'),
      supabase.from('ai_insights').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('decision_predictions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('decision_reports').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('decision_jobs').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['QUEUED', 'RUNNING']),
    ]);

    return {
      datasets: datasets || 0,
      analyses: 0,
      experiments: experiments || 0,
      completedExperiments: completedExperiments || 0,
      insights: insights || 0,
      predictions: predictions || 0,
      reports: reports || 0,
      activeJobs: activeJobs || 0,
    };
  }

  static async getRecentDatasets(userId: string, limit = 5): Promise<DatasetSummary[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('datasets')
      .select('id, original_filename, row_count, column_count, status, profile, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch recent datasets', { error: error.message });
      return [];
    }

    return (data || []).map((d) => ({
      id: d.id,
      name: d.original_filename,
      rowCount: d.row_count,
      columnCount: d.column_count,
      qualityScore: d.profile?.quality_score ?? null,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  static async getRecentExperiments(userId: string, limit = 5): Promise<ExperimentSummary[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ml_experiments')
      .select('id, name, status, primary_metric, best_model_id, target_column, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch recent experiments', { error: error.message });
      return [];
    }

    const experiments: ExperimentSummary[] = [];
    for (const exp of data || []) {
      let modelType = 'unknown';
      let primaryMetricValue: number | null = null;

      if (exp.best_model_id) {
        const { data: model } = await supabase
          .from('ml_models')
          .select('model_type, metrics')
          .eq('id', exp.best_model_id)
          .single();

        if (model) {
          modelType = model.model_type;
          if (exp.primary_metric && model.metrics?.[exp.primary_metric] !== undefined) {
            primaryMetricValue = parseFloat(model.metrics[exp.primary_metric]);
          }
        }
      }

      experiments.push({
        id: exp.id,
        name: exp.name,
        modelType,
        status: exp.status,
        primaryMetric: exp.primary_metric,
        primaryMetricValue,
        targetColumn: exp.target_column,
        createdAt: exp.created_at,
      });
    }

    return experiments;
  }

  static async getRecentInsights(userId: string, limit = 5): Promise<InsightSummary[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ai_insights')
      .select('id, title, severity, category, confidence, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch recent insights', { error: error.message });
      return [];
    }

    return (data || []).map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      category: i.category,
      confidence: i.confidence,
      createdAt: i.created_at,
    }));
  }

  static async getRecentActivity(userId: string, limit = 20): Promise<ActivityItem[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('decision_history')
      .select('id, action_type, reference_id, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch recent activity', { error: error.message });
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      type: item.action_type,
      description: this.getActionDescription(item.action_type),
      metadata: (item.metadata || {}) as Record<string, unknown>,
      createdAt: item.created_at,
    }));
  }

  static async getActiveJobs(userId: string): Promise<JobSummary[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('decision_jobs')
      .select('id, job_type, status, progress, created_at')
      .eq('user_id', userId)
      .in('status', ['QUEUED', 'RUNNING'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch active jobs', { error: error.message });
      return [];
    }

    return (data || []).map((j) => ({
      id: j.id,
      jobType: j.job_type,
      status: j.status,
      progress: j.progress,
      createdAt: j.created_at,
    }));
  }

  private static getActionDescription(actionType: string): string {
    const descriptions: Record<string, string> = {
      prediction: 'Prediction created',
      scenario: 'Scenario analysis completed',
      scenario_comparison: 'Scenarios compared',
      sensitivity_analysis: 'Sensitivity analysis completed',
      recommendation: 'Recommendation generated',
      report: 'Report created',
    };
    return descriptions[actionType] || actionType.replace(/_/g, ' ');
  }
}
