import { getSupabase } from '../config/supabase.js';
import {
  DecisionPrediction,
  DecisionScenario,
  DecisionScenarioComparison,
  DecisionSensitivityAnalysis,
  DecisionRecommendation,
  DecisionReport,
  DecisionHistoryItem,
  DecisionFactors,
  DecisionJob,
  ValidationResult,
  BatchPredictionResult,
} from '../types/decision.js';
import { logger } from '../utils/logger.js';
import { JobService } from './jobService.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
const MAX_SENSITIVITY_POINTS = 50;
const MAX_SCENARIOS_PER_REQUEST = 10;
const MAX_BATCH_SIZE = 10000;

interface PredictionResponse {
  prediction: Record<string, unknown>;
  probability?: Record<string, unknown>;
  feature_contributions?: Record<string, number>;
  model_type?: string;
}

interface BatchPredictionResponse {
  total: number;
  successful: number;
  failed: number;
  predictions: Array<{
    index: number;
    status: string;
    result?: PredictionResponse;
    error?: string;
  }>;
  errors: Array<{
    index: number;
    status: string;
    error: string;
  }>;
}

export class DecisionService {
  static async createPrediction(
    datasetId: string,
    experimentId: string,
    modelId: string,
    inputData: Record<string, unknown>,
    prediction: Record<string, unknown>,
    probability?: Record<string, unknown>,
    featureContributions?: Record<string, number>,
    explanation?: string
  ): Promise<DecisionPrediction> {
    const { data, error } = await getSupabase()
      .from('decision_predictions')
      .insert({
        dataset_id: datasetId,
        experiment_id: experimentId,
        model_id: modelId,
        input_data: inputData,
        prediction,
        probability,
        feature_contributions: featureContributions,
        explanation,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save prediction', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    await this.logHistory(datasetId, experimentId, 'prediction', data.id);
    return data as DecisionPrediction;
  }

  static async getPredictions(datasetId?: string, experimentId?: string): Promise<DecisionPrediction[]> {
    let query = getSupabase().from('decision_predictions').select('*').order('created_at', { ascending: false });
    if (datasetId) query = query.eq('dataset_id', datasetId);
    if (experimentId) query = query.eq('experiment_id', experimentId);
    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch predictions', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []) as DecisionPrediction[];
  }

  static async createScenario(
    datasetId: string,
    experimentId: string,
    modelId: string,
    scenarioName: string,
    baselineInput: Record<string, unknown>,
    scenarioInput: Record<string, unknown>,
    baselinePrediction: Record<string, unknown>,
    scenarioPrediction: Record<string, unknown>,
    difference: Record<string, unknown>
  ): Promise<DecisionScenario> {
    const { data, error } = await getSupabase()
      .from('decision_scenarios')
      .insert({
        dataset_id: datasetId,
        experiment_id: experimentId,
        model_id: modelId,
        scenario_name: scenarioName,
        baseline_input: baselineInput,
        scenario_input: scenarioInput,
        baseline_prediction: baselinePrediction,
        scenario_prediction: scenarioPrediction,
        difference,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save scenario', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    await this.logHistory(datasetId, experimentId, 'scenario', data.id);
    return data as DecisionScenario;
  }

  static async getScenarios(datasetId?: string, experimentId?: string): Promise<DecisionScenario[]> {
    let query = getSupabase().from('decision_scenarios').select('*').order('created_at', { ascending: false });
    if (datasetId) query = query.eq('dataset_id', datasetId);
    if (experimentId) query = query.eq('experiment_id', experimentId);
    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch scenarios', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []) as DecisionScenario[];
  }

  static async createScenarioComparison(
    datasetId: string,
    experimentId: string,
    modelId: string,
    scenarioIds: string[],
    comparisonResults: Record<string, unknown>
  ): Promise<DecisionScenarioComparison> {
    const { data, error } = await getSupabase()
      .from('decision_scenario_comparisons')
      .insert({
        dataset_id: datasetId,
        experiment_id: experimentId,
        model_id: modelId,
        scenario_ids: scenarioIds,
        comparison_results: comparisonResults,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save scenario comparison', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    await this.logHistory(datasetId, experimentId, 'scenario_comparison', data.id);
    return data as DecisionScenarioComparison;
  }

  static async createSensitivityAnalysis(
    datasetId: string,
    experimentId: string,
    modelId: string,
    featureName: string,
    values: unknown[],
    predictions: unknown[]
  ): Promise<DecisionSensitivityAnalysis> {
    const { data, error } = await getSupabase()
      .from('decision_sensitivity_analyses')
      .insert({
        dataset_id: datasetId,
        experiment_id: experimentId,
        model_id: modelId,
        feature_name: featureName,
        values,
        predictions,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save sensitivity analysis', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    await this.logHistory(datasetId, experimentId, 'sensitivity_analysis', data.id);
    return data as DecisionSensitivityAnalysis;
  }

  static async createRecommendation(
    datasetId: string,
    experimentId: string,
    recommendation: Omit<DecisionRecommendation, 'id' | 'dataset_id' | 'experiment_id' | 'created_at'>
  ): Promise<DecisionRecommendation> {
    const { data, error } = await getSupabase()
      .from('decision_recommendations')
      .insert({
        dataset_id: datasetId,
        experiment_id: experimentId,
        ...recommendation,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save recommendation', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    await this.logHistory(datasetId, experimentId, 'recommendation', data.id);
    return data as DecisionRecommendation;
  }

  static async getRecommendations(datasetId?: string, experimentId?: string): Promise<DecisionRecommendation[]> {
    let query = getSupabase().from('decision_recommendations').select('*').order('created_at', { ascending: false });
    if (datasetId) query = query.eq('dataset_id', datasetId);
    if (experimentId) query = query.eq('experiment_id', experimentId);
    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch recommendations', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []) as DecisionRecommendation[];
  }

  static async createReport(
    datasetId: string,
    experimentId: string,
    reportType: string,
    content: Record<string, unknown>
  ): Promise<DecisionReport> {
    const { data, error } = await getSupabase()
      .from('decision_reports')
      .insert({
        dataset_id: datasetId,
        experiment_id: experimentId,
        report_type: reportType,
        content,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save report', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    await this.logHistory(datasetId, experimentId, 'report', data.id);
    return data as DecisionReport;
  }

  static async getReports(datasetId?: string, experimentId?: string): Promise<DecisionReport[]> {
    let query = getSupabase().from('decision_reports').select('*').order('created_at', { ascending: false });
    if (datasetId) query = query.eq('dataset_id', datasetId);
    if (experimentId) query = query.eq('experiment_id', experimentId);
    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch reports', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []) as DecisionReport[];
  }

  static async getHistory(datasetId?: string, experimentId?: string): Promise<DecisionHistoryItem[]> {
    let query = getSupabase().from('decision_history').select('*').order('created_at', { ascending: false });
    if (datasetId) query = query.eq('dataset_id', datasetId);
    if (experimentId) query = query.eq('experiment_id', experimentId);
    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch decision history', { error });
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []) as DecisionHistoryItem[];
  }

  static async getDecisionFactors(experimentId: string): Promise<DecisionFactors> {
    const { data: experiment, error: expError } = await getSupabase()
      .from('ml_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expError || !experiment) {
      throw new Error('Experiment not found');
    }

    const { data: models } = await getSupabase()
      .from('ml_models')
      .select('*')
      .eq('experiment_id', experimentId);

    const bestModel = models?.find((m) => m.id === experiment.best_model_id) || models?.[0];

    if (!bestModel || !bestModel.feature_importance) {
      return { factors: [] };
    }

    const factors = Object.entries(bestModel.feature_importance).map(([factor, importance]) => ({
      factor,
      importance: importance as number,
      direction: 'model-dependent',
      evidence_source: 'feature_importance',
    }));

    return { factors };
  }

  static async validatePredictionInput(
    datasetId: string,
    experimentId: string,
    modelId: string,
    inputData: Record<string, unknown>
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { data: experiment, error: expError } = await getSupabase()
      .from('ml_experiments')
      .select('*')
      .eq('id', experimentId)
      .eq('dataset_id', datasetId)
      .single();

    if (expError || !experiment) {
      errors.push('Experiment not found or does not belong to the specified dataset');
      return { valid: false, errors, warnings };
    }

    const { data: model, error: modelError } = await getSupabase()
      .from('ml_models')
      .select('*')
      .eq('id', modelId)
      .eq('experiment_id', experimentId)
      .single();

    if (modelError || !model) {
      errors.push('Model not found or does not belong to the specified experiment');
      return { valid: false, errors, warnings };
    }

    if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
      errors.push('input_data must be an object');
      return { valid: false, errors, warnings };
    }

    const selectedFeatures = experiment.selected_features as string[] | undefined;

    if (selectedFeatures && selectedFeatures.length > 0) {
      const inputFeatures = Object.keys(inputData);

      const unknownFeatures = inputFeatures.filter((f) => !selectedFeatures.includes(f));
      if (unknownFeatures.length > 0) {
        errors.push(`Unknown features not used during training: ${unknownFeatures.join(', ')}`);
      }

      const missingFeatures = selectedFeatures.filter((f) => !inputFeatures.includes(f));
      if (missingFeatures.length > 0) {
        errors.push(`Missing required features: ${missingFeatures.join(', ')}`);
      }
    }

    for (const [key, value] of Object.entries(inputData)) {
      if (value === null || value === undefined) {
        errors.push(`Feature '${key}' has null or undefined value`);
      } else if (typeof value === 'string' && value.trim() === '') {
        warnings.push(`Feature '${key}' has empty string value`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  static async runPrediction(
    datasetId: string,
    experimentId: string,
    modelId: string,
    inputData: Record<string, unknown>,
    storeResult: boolean = true
  ): Promise<DecisionPrediction> {
    const validation = await this.validatePredictionInput(datasetId, experimentId, modelId, inputData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const response = await fetch(`${PYTHON_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_id: modelId,
        features: inputData,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || 'Prediction service error');
    }

    const result = (await response.json()) as PredictionResponse;

    if (!storeResult) {
      return {
        id: '',
        dataset_id: datasetId,
        experiment_id: experimentId,
        model_id: modelId,
        input_data: inputData,
        prediction: result.prediction,
        probability: result.probability,
        feature_contributions: result.feature_contributions,
        created_at: new Date().toISOString(),
      };
    }

    return this.createPrediction(
      datasetId,
      experimentId,
      modelId,
      inputData,
      result.prediction,
      result.probability,
      result.feature_contributions
    );
  }

  static async runBatchPrediction(
    datasetId: string,
    experimentId: string,
    modelId: string,
    records: Record<string, unknown>[],
    storeResults: boolean = true
  ): Promise<BatchPredictionResult> {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Records must be a non-empty array');
    }

    if (records.length > MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
    }

    const response = await fetch(`${PYTHON_SERVICE_URL}/batch-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_id: modelId,
        records,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || 'Batch prediction service error');
    }

    const result = (await response.json()) as BatchPredictionResponse;

    if (storeResults && result.predictions) {
      for (const pred of result.predictions) {
        if (pred.status === 'success' && pred.result) {
          await this.createPrediction(
            datasetId,
            experimentId,
            modelId,
            records[pred.index],
            pred.result.prediction,
            pred.result.probability,
            pred.result.feature_contributions
          );
        }
      }
    }

    return {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      predictions: result.predictions.map((p) => ({
        index: p.index,
        status: p.status,
        result: p.result as Record<string, unknown> | undefined,
        error: p.error,
      })),
    };
  }

  static async runBatchPredictionAsync(
    datasetId: string,
    experimentId: string,
    modelId: string,
    records: Record<string, unknown>[]
  ): Promise<DecisionJob> {
    const job = await JobService.createJob('batch_prediction', datasetId, experimentId, modelId, {
      record_count: records.length,
    });

    this.executeBatchPredictionAsync(job.id, datasetId, experimentId, modelId, records).catch((error) => {
      logger.error('Async batch prediction failed', { jobId: job.id, error });
    });

    return job;
  }

  private static async executeBatchPredictionAsync(
    jobId: string,
    datasetId: string,
    experimentId: string,
    modelId: string,
    records: Record<string, unknown>[]
  ): Promise<void> {
    await JobService.updateJobStatus(jobId, 'RUNNING', 0);

    try {
      const batchSize = 100;
      const totalBatches = Math.ceil(records.length / batchSize);
      const allPredictions: Array<{ index: number; status: string; result?: PredictionResponse; error?: string }> = [];
      let processedCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = records.slice(i * batchSize, (i + 1) * batchSize);

        const response = await fetch(`${PYTHON_SERVICE_URL}/batch-predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: modelId,
            records: batch,
          }),
        });

        if (!response.ok) {
          throw new Error(`Batch ${i + 1} failed: ${await response.text()}`);
        }

        const result = (await response.json()) as BatchPredictionResponse;
        allPredictions.push(...result.predictions);
        processedCount += batch.length;

        const progress = Math.round((processedCount / records.length) * 100);
        await JobService.updateJobStatus(jobId, 'RUNNING', progress);
      }

      const successful = allPredictions.filter((p) => p.status === 'success').length;
      const failed = allPredictions.filter((p) => p.status === 'error').length;

      for (const pred of allPredictions) {
        if (pred.status === 'success' && pred.result) {
          await this.createPrediction(
            datasetId,
            experimentId,
            modelId,
            records[pred.index],
            pred.result.prediction,
            pred.result.probability,
            pred.result.feature_contributions
          );
        }
      }

      await JobService.updateJobStatus(jobId, 'COMPLETED', 100, {
        total: records.length,
        successful,
        failed,
        predictions: allPredictions,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await JobService.updateJobStatus(jobId, 'FAILED', undefined, undefined, errorMessage);
    }
  }

  static async runScenario(
    datasetId: string,
    experimentId: string,
    modelId: string,
    baselineInput: Record<string, unknown>,
    scenarioInput: Record<string, unknown>,
    scenarioName?: string
  ): Promise<DecisionScenario> {
    const baselineValidation = await this.validatePredictionInput(datasetId, experimentId, modelId, baselineInput);
    if (!baselineValidation.valid) {
      throw new Error(`Baseline validation failed: ${baselineValidation.errors.join('; ')}`);
    }

    const scenarioValidation = await this.validatePredictionInput(datasetId, experimentId, modelId, scenarioInput);
    if (!scenarioValidation.valid) {
      throw new Error(`Scenario validation failed: ${scenarioValidation.errors.join('; ')}`);
    }

    const baselineResult = await this.runPrediction(datasetId, experimentId, modelId, baselineInput, false);
    const scenarioResult = await this.runPrediction(datasetId, experimentId, modelId, scenarioInput, false);

    const difference = this.computeDifference(baselineResult.prediction, scenarioResult.prediction);
    const probDifference = this.computeProbabilityDifference(baselineResult.probability, scenarioResult.probability);

    return this.createScenario(
      datasetId,
      experimentId,
      modelId,
      scenarioName || 'Scenario',
      baselineInput,
      scenarioInput,
      baselineResult.prediction,
      scenarioResult.prediction,
      { ...difference, ...probDifference }
    );
  }

  static async compareScenarios(
    datasetId: string,
    experimentId: string,
    modelId: string,
    scenarioIds: string[]
  ): Promise<DecisionScenarioComparison> {
    if (scenarioIds.length > MAX_SCENARIOS_PER_REQUEST) {
      throw new Error(`Cannot compare more than ${MAX_SCENARIOS_PER_REQUEST} scenarios at once`);
    }

    const scenarios = await this.getScenarios(datasetId, experimentId);
    const selectedScenarios = scenarios.filter((s) => scenarioIds.includes(s.id));

    if (selectedScenarios.length !== scenarioIds.length) {
      const foundIds = selectedScenarios.map((s) => s.id);
      const missingIds = scenarioIds.filter((id) => !foundIds.includes(id));
      throw new Error(`Scenarios not found: ${missingIds.join(', ')}`);
    }

    const invalidModelScenarios = selectedScenarios.filter((s) => s.model_id !== modelId);
    if (invalidModelScenarios.length > 0) {
      throw new Error('All scenarios must belong to the same model for comparison');
    }

    const comparisonResults: Record<string, unknown> = {
      scenarios: selectedScenarios.map((s) => ({
        id: s.id,
        name: s.scenario_name,
        baseline_input: s.baseline_input,
        scenario_input: s.scenario_input,
        prediction: s.scenario_prediction,
        difference_from_baseline: s.difference,
      })),
      summary: this.computeComparisonSummary(selectedScenarios),
    };

    return this.createScenarioComparison(datasetId, experimentId, modelId, scenarioIds, comparisonResults);
  }

  static async runSensitivityAnalysis(
    datasetId: string,
    experimentId: string,
    modelId: string,
    featureName: string,
    baseInput: Record<string, unknown>,
    values: unknown[]
  ): Promise<DecisionSensitivityAnalysis> {
    if (values.length > MAX_SENSITIVITY_POINTS) {
      throw new Error(`Sensitivity analysis supports maximum ${MAX_SENSITIVITY_POINTS} points`);
    }

    const predictions: unknown[] = [];

    for (const value of values) {
      const modifiedInput = { ...baseInput, [featureName]: value };
      const result = await this.runPrediction(datasetId, experimentId, modelId, modifiedInput, false);
      predictions.push({
        value,
        prediction: result.prediction,
        probability: result.probability,
      });
    }

    return this.createSensitivityAnalysis(datasetId, experimentId, modelId, featureName, values, predictions);
  }

  static async runSensitivityAnalysisAsync(
    datasetId: string,
    experimentId: string,
    modelId: string,
    featureName: string,
    baseInput: Record<string, unknown>,
    values: unknown[]
  ): Promise<DecisionJob> {
    const job = await JobService.createJob('sensitivity_analysis', datasetId, experimentId, modelId, {
      feature_name: featureName,
      point_count: values.length,
    });

    this.executeSensitivityAnalysisAsync(job.id, datasetId, experimentId, modelId, featureName, baseInput, values).catch(
      (error) => {
        logger.error('Async sensitivity analysis failed', { jobId: job.id, error });
      }
    );

    return job;
  }

  private static async executeSensitivityAnalysisAsync(
    jobId: string,
    datasetId: string,
    experimentId: string,
    modelId: string,
    featureName: string,
    baseInput: Record<string, unknown>,
    values: unknown[]
  ): Promise<void> {
    await JobService.updateJobStatus(jobId, 'RUNNING', 0);

    try {
      const predictions: unknown[] = [];

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const modifiedInput = { ...baseInput, [featureName]: value };
        const result = await this.runPrediction(datasetId, experimentId, modelId, modifiedInput, false);
        predictions.push({
          value,
          prediction: result.prediction,
          probability: result.probability,
        });

        const progress = Math.round(((i + 1) / values.length) * 100);
        await JobService.updateJobStatus(jobId, 'RUNNING', progress);
      }

      const analysis = await this.createSensitivityAnalysis(datasetId, experimentId, modelId, featureName, values, predictions);

      await JobService.updateJobStatus(jobId, 'COMPLETED', 100, {
        analysis_id: analysis.id,
        feature_name: featureName,
        values,
        predictions,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await JobService.updateJobStatus(jobId, 'FAILED', undefined, undefined, errorMessage);
    }
  }

  private static computeDifference(
    baseline: Record<string, unknown>,
    scenario: Record<string, unknown>
  ): Record<string, unknown> {
    const difference: Record<string, unknown> = {};
    for (const key of Object.keys(baseline)) {
      if (key in scenario) {
        const bVal = baseline[key];
        const sVal = scenario[key];
        if (typeof bVal === 'number' && typeof sVal === 'number') {
          difference[key] = round(sVal - bVal, 4);
        } else {
          difference[key] = { baseline: bVal, scenario: sVal };
        }
      }
    }
    return difference;
  }

  private static computeProbabilityDifference(
    baseline?: Record<string, unknown>,
    scenario?: Record<string, unknown>
  ): Record<string, unknown> {
    if (!baseline || !scenario) {
      return {};
    }

    const probDiff: Record<string, unknown> = {};
    for (const key of Object.keys(baseline)) {
      if (key in scenario) {
        const bVal = baseline[key];
        const sVal = scenario[key];
        if (typeof bVal === 'number' && typeof sVal === 'number') {
          probDiff[`probability_diff_${key}`] = round(sVal - bVal, 4);
        }
      }
    }
    return probDiff;
  }

  private static computeComparisonSummary(scenarios: DecisionScenario[]): Record<string, unknown> {
    const baseline = scenarios[0];
    const comparisons = scenarios.map((s) => ({
      name: s.scenario_name,
      prediction: s.scenario_prediction,
      difference: s.difference,
    }));

    return {
      baseline_prediction: baseline.baseline_prediction,
      comparisons,
    };
  }

  private static async logHistory(
    datasetId: string,
    experimentId: string | undefined,
    actionType: string,
    referenceId: string
  ): Promise<void> {
    await getSupabase().from('decision_history').insert({
      dataset_id: datasetId,
      experiment_id: experimentId,
      action_type: actionType,
      reference_id: referenceId,
    });
  }
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
