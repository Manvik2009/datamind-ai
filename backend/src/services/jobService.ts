import { getSupabase } from '../config/supabase.js';
import { DecisionJob } from '../types/decision.js';
import { logger } from '../utils/logger.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

export class JobService {
  static async createJob(jobType: string, datasetId: string, experimentId?: string, modelId?: string, inputData?: Record<string, unknown>): Promise<DecisionJob> {
    const { data, error } = await getSupabase()
      .from('decision_jobs')
      .insert({
        job_type: jobType,
        dataset_id: datasetId,
        experiment_id: experimentId,
        model_id: modelId,
        input_data: inputData,
        status: 'QUEUED',
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create job', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DecisionJob;
  }

  static async getJob(jobId: string): Promise<DecisionJob | null> {
    const { data, error } = await getSupabase()
      .from('decision_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return null;
    }

    return data as DecisionJob;
  }

  static async updateJobStatus(jobId: string, status: string, progress?: number, result?: Record<string, unknown>, errorMessage?: string): Promise<void> {
    const update: Record<string, unknown> = { status };

    if (status === 'RUNNING' && !await this.hasStarted(jobId)) {
      update.started_at = new Date().toISOString();
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      update.completed_at = new Date().toISOString();
    }

    if (progress !== undefined) {
      update.progress = Math.min(100, Math.max(0, progress));
    }

    if (result !== undefined) {
      update.result = result;
    }

    if (errorMessage !== undefined) {
      update.error_message = errorMessage;
    }

    await getSupabase()
      .from('decision_jobs')
      .update(update)
      .eq('id', jobId);
  }

  static async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') {
      return false;
    }

    await this.updateJobStatus(jobId, 'CANCELLED');
    return true;
  }

  static async getJobs(datasetId?: string, status?: string): Promise<DecisionJob[]> {
    let query = getSupabase().from('decision_jobs').select('*').order('created_at', { ascending: false });

    if (datasetId) {
      query = query.eq('dataset_id', datasetId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch jobs', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []) as DecisionJob[];
  }

  private static async hasStarted(jobId: string): Promise<boolean> {
    const { data } = await getSupabase()
      .from('decision_jobs')
      .select('started_at')
      .eq('id', jobId)
      .single();

    return !!data?.started_at;
  }
}
