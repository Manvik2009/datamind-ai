import { getSupabase } from '../config/supabase.js';
import { MLExperiment, MLModel, MLPrediction, ExperimentResult } from '../types/ml.js';
import { logger } from '../utils/logger.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

export class MLService {
  static async createExperiment(datasetId: string, config: {
    name: string;
    target_column: string;
    problem_type?: string;
    test_size: number;
    random_seed: number;
    selected_features?: string[];
    selected_models?: string[];
  }): Promise<MLExperiment> {
    const { data, error } = await getSupabase()
      .from('ml_experiments')
      .insert({
        dataset_id: datasetId,
        name: config.name,
        target_column: config.target_column,
        problem_type: config.problem_type,
        selected_features: config.selected_features || [],
        preprocessing_config: {},
        train_test_split: {
          train_size: 1 - config.test_size,
          test_size: config.test_size,
          random_seed: config.random_seed,
        },
        status: 'QUEUED',
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create ML experiment', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return data as MLExperiment;
  }

  static async getExperiments(datasetId?: string): Promise<MLExperiment[]> {
    let query = getSupabase().from('ml_experiments').select('*').order('created_at', { ascending: false });
    if (datasetId) {
      query = query.eq('dataset_id', datasetId);
    }
    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch ML experiments', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []) as MLExperiment[];
  }

  static async getExperiment(id: string): Promise<(MLExperiment & { models: MLModel[]; predictions: MLPrediction[] }) | null> {
    const { data: experiment, error: expError } = await getSupabase()
      .from('ml_experiments')
      .select('*')
      .eq('id', id)
      .single();

    if (expError || !experiment) {
      return null;
    }

    const { data: models } = await getSupabase()
      .from('ml_models')
      .select('*')
      .eq('experiment_id', id);

    const { data: predictions } = await getSupabase()
      .from('ml_predictions')
      .select('*')
      .eq('experiment_id', id);

    return {
      ...experiment,
      models: (models || []) as MLModel[],
      predictions: (predictions || []) as MLPrediction[],
    };
  }

  static async updateExperimentStatus(id: string, status: string, result?: ExperimentResult): Promise<void> {
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'COMPLETED') {
      update.completed_at = new Date().toISOString();
    }
    if (result) {
      update.best_model_id = result.best_model.model_id;
      update.primary_metric = result.primary_metric;
    }
    const { error } = await getSupabase().from('ml_experiments').update(update).eq('id', id);
    if (error) {
      logger.error('Failed to update experiment status', { error });
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async saveModel(experimentId: string, modelResult: {
    model_type: string;
    model_id: string;
    metrics: Record<string, unknown>;
    feature_importance?: Record<string, number>;
    random_seed: number;
  }): Promise<MLModel> {
    const { data, error } = await getSupabase()
      .from('ml_models')
      .insert({
        experiment_id: experimentId,
        model_type: modelResult.model_type,
        version: 1,
        metrics: modelResult.metrics,
        feature_importance: modelResult.feature_importance || {},
        preprocessing_version: 'v1',
        random_seed: modelResult.random_seed,
        status: 'TRAINED',
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save ML model', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return data as MLModel;
  }

  static async deleteExperiment(id: string): Promise<boolean> {
    const { data, error } = await getSupabase()
      .from('ml_experiments')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    const { error: deleteError } = await getSupabase().from('ml_experiments').delete().eq('id', id);
    if (deleteError) {
      logger.error('Failed to delete experiment', { error: deleteError });
      throw new Error(`Database error: ${deleteError.message}`);
    }
    return true;
  }

  static async getDatasetFilePath(datasetId: string): Promise<string | null> {
    const { data, error } = await getSupabase()
      .from('datasets')
      .select('file_path')
      .eq('id', datasetId)
      .single();

    if (error || !data) {
      return null;
    }
    return data.file_path;
  }

  static async runTraining(experimentId: string): Promise<void> {
    await this.updateExperimentStatus(experimentId, 'RUNNING');

    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const datasetPath = await this.getDatasetFilePath(experiment.dataset_id);
      if (!datasetPath) {
        throw new Error('Dataset file not found');
      }

      const requestBody = {
        dataset_path: datasetPath,
        target_column: experiment.target_column,
        problem_type: experiment.problem_type,
        test_size: experiment.train_test_split.test_size,
        random_seed: experiment.train_test_split.random_seed,
        selected_features: experiment.selected_features || [],
      };

      const response = await fetch(`${PYTHON_SERVICE_URL}/ml/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Python ML service error');
      }

      const result = await response.json() as ExperimentResult;

      for (const modelResult of result.comparison) {
        await this.saveModel(experimentId, {
          model_type: modelResult.model_type,
          model_id: modelResult.model_id,
          metrics: modelResult.metrics,
          random_seed: experiment.train_test_split.random_seed,
        });
      }

      await this.updateExperimentStatus(experimentId, 'COMPLETED', result);
    } catch (error) {
      logger.error('Training failed', { error });
      await this.updateExperimentStatus(experimentId, 'FAILED');
      throw error;
    }
  }
}
