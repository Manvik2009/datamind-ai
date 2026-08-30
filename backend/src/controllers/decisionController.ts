import { Request, Response } from 'express';
import { DecisionService } from '../services/decisionService.js';
import { JobService } from '../services/jobService.js';
import { AIService } from '../ai/ai.service.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const createPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, model_id, input_data } = req.body;

  if (!dataset_id || !experiment_id || !model_id || !input_data) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, model_id, and input_data are required');
  }

  if (typeof input_data !== 'object' || Array.isArray(input_data)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'input_data must be an object');
  }

  const prediction = await DecisionService.runPrediction(dataset_id, experiment_id, model_id, input_data);
  res.status(201).json(successResponse(prediction, req.originalUrl));
});

export const getPredictions = asyncHandler(async (req: Request, res: Response) => {
  const dataset_id = req.query.dataset_id as string | undefined;
  const experiment_id = req.query.experiment_id as string | undefined;
  const predictions = await DecisionService.getPredictions(dataset_id, experiment_id);
  res.status(200).json(successResponse(predictions, req.originalUrl));
});

export const createBatchPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, model_id, records, async } = req.body;

  if (!dataset_id || !experiment_id || !model_id || !records) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, model_id, and records are required');
  }

  if (!Array.isArray(records)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'records must be an array');
  }

  if (records.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'records array cannot be empty');
  }

  if (async) {
    const job = await DecisionService.runBatchPredictionAsync(dataset_id, experiment_id, model_id, records);
    res.status(202).json(
      successResponse(
        {
          job_id: job.id,
          status: job.status,
          message: 'Batch prediction queued for processing',
        },
        req.originalUrl
      )
    );
    return;
  }

  const result = await DecisionService.runBatchPrediction(dataset_id, experiment_id, model_id, records);
  res.status(201).json(successResponse(result, req.originalUrl));
});

export const createScenario = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, model_id, baseline_input, scenario_input, scenario_name } = req.body;

  if (!dataset_id || !experiment_id || !model_id || !baseline_input || !scenario_input) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'dataset_id, experiment_id, model_id, baseline_input, and scenario_input are required'
    );
  }

  if (typeof baseline_input !== 'object' || Array.isArray(baseline_input)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'baseline_input must be an object');
  }

  if (typeof scenario_input !== 'object' || Array.isArray(scenario_input)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'scenario_input must be an object');
  }

  const scenario = await DecisionService.runScenario(
    dataset_id,
    experiment_id,
    model_id,
    baseline_input,
    scenario_input,
    scenario_name
  );
  res.status(201).json(successResponse(scenario, req.originalUrl));
});

export const getScenarios = asyncHandler(async (req: Request, res: Response) => {
  const dataset_id = req.query.dataset_id as string | undefined;
  const experiment_id = req.query.experiment_id as string | undefined;
  const scenarios = await DecisionService.getScenarios(dataset_id, experiment_id);
  res.status(200).json(successResponse(scenarios, req.originalUrl));
});

export const compareScenarios = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, model_id, scenario_ids } = req.body;

  if (!dataset_id || !experiment_id || !model_id || !scenario_ids || !Array.isArray(scenario_ids)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, model_id, and scenario_ids array are required');
  }

  if (scenario_ids.length < 2) {
    throw new AppError(400, 'VALIDATION_ERROR', 'At least 2 scenarios are required for comparison');
  }

  const comparison = await DecisionService.compareScenarios(dataset_id, experiment_id, model_id, scenario_ids);
  res.status(201).json(successResponse(comparison, req.originalUrl));
});

export const runSensitivityAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, model_id, feature_name, base_input, values, async } = req.body;

  if (!dataset_id || !experiment_id || !model_id || !feature_name || !base_input || !values || !Array.isArray(values)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'dataset_id, experiment_id, model_id, feature_name, base_input, and values array are required'
    );
  }

  if (values.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'values array cannot be empty');
  }

  if (async) {
    const job = await DecisionService.runSensitivityAnalysisAsync(
      dataset_id,
      experiment_id,
      model_id,
      feature_name,
      base_input,
      values
    );
    res.status(202).json(
      successResponse(
        {
          job_id: job.id,
          status: job.status,
          message: 'Sensitivity analysis queued for processing',
        },
        req.originalUrl
      )
    );
    return;
  }

  const analysis = await DecisionService.runSensitivityAnalysis(
    dataset_id,
    experiment_id,
    model_id,
    feature_name,
    base_input,
    values
  );
  res.status(201).json(successResponse(analysis, req.originalUrl));
});

export const getDecisionFactors = asyncHandler(async (req: Request, res: Response) => {
  const experiment_id = req.params.experiment_id as string;
  if (!experiment_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'experiment_id is required');
  }
  const factors = await DecisionService.getDecisionFactors(experiment_id);
  res.status(200).json(successResponse(factors, req.originalUrl));
});

export const createRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, title, description, evidence, impact_area, confidence, limitations } = req.body;

  if (!dataset_id || !experiment_id || !title || !description || !impact_area) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, title, description, and impact_area are required');
  }

  const validImpactAreas = ['data_quality', 'model_quality', 'customer_segment', 'operations', 'investigation'];
  if (!validImpactAreas.includes(impact_area)) {
    throw new AppError(400, 'VALIDATION_ERROR', `impact_area must be one of: ${validImpactAreas.join(', ')}`);
  }

  const validConfidence = ['low', 'medium', 'high'];
  if (confidence && !validConfidence.includes(confidence)) {
    throw new AppError(400, 'VALIDATION_ERROR', `confidence must be one of: ${validConfidence.join(', ')}`);
  }

  const recommendation = await DecisionService.createRecommendation(dataset_id, experiment_id, {
    title,
    description,
    evidence: evidence || [],
    impact_area,
    confidence: confidence || 'medium',
    limitations: limitations || [],
  });

  res.status(201).json(successResponse(recommendation, req.originalUrl));
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const dataset_id = req.query.dataset_id as string | undefined;
  const experiment_id = req.query.experiment_id as string | undefined;
  const recommendations = await DecisionService.getRecommendations(dataset_id, experiment_id);
  res.status(200).json(successResponse(recommendations, req.originalUrl));
});

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, report_type, content } = req.body;

  if (!dataset_id || !experiment_id || !content) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, and content are required');
  }

  if (typeof content !== 'object') {
    throw new AppError(400, 'VALIDATION_ERROR', 'content must be an object');
  }

  const report = await DecisionService.createReport(dataset_id, experiment_id, report_type || 'full', content);
  res.status(201).json(successResponse(report, req.originalUrl));
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const dataset_id = req.query.dataset_id as string | undefined;
  const experiment_id = req.query.experiment_id as string | undefined;
  const reports = await DecisionService.getReports(dataset_id, experiment_id);
  res.status(200).json(successResponse(reports, req.originalUrl));
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const dataset_id = req.query.dataset_id as string | undefined;
  const experiment_id = req.query.experiment_id as string | undefined;
  const history = await DecisionService.getHistory(dataset_id, experiment_id);
  res.status(200).json(successResponse(history, req.originalUrl));
});

export const getJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const job_id = req.params.job_id as string;

  if (!job_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'job_id is required');
  }

  const job = await JobService.getJob(job_id);
  if (!job) {
    throw new AppError(404, 'NOT_FOUND', 'Job not found');
  }

  res.status(200).json(successResponse(job, req.originalUrl));
});

export const cancelJob = asyncHandler(async (req: Request, res: Response) => {
  const job_id = req.params.job_id as string;

  if (!job_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'job_id is required');
  }

  const cancelled = await JobService.cancelJob(job_id);
  if (!cancelled) {
    throw new AppError(400, 'INVALID_STATE', 'Job cannot be cancelled (may already be completed or failed)');
  }

  res.status(200).json(successResponse({ job_id, status: 'CANCELLED' }, req.originalUrl));
});

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const dataset_id = req.query.dataset_id as string | undefined;
  const status = req.query.status as string | undefined;
  const jobs = await JobService.getJobs(dataset_id, status);
  res.status(200).json(successResponse(jobs, req.originalUrl));
});

export const explainPrediction = asyncHandler(async (req: Request, res: Response) => {
  const prediction_id = req.params.prediction_id as string;

  if (!prediction_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'prediction_id is required');
  }

  const predictions = await DecisionService.getPredictions();
  const prediction = predictions.find((p) => p.id === prediction_id);

  if (!prediction) {
    throw new AppError(404, 'NOT_FOUND', 'Prediction not found');
  }

  const explanation = await AIService.explainDecision({
    prediction: prediction.prediction as { value: unknown; target_column?: string },
    probability: prediction.probability as Record<string, number> | undefined,
    feature_contributions: prediction.feature_contributions,
    input_data: prediction.input_data,
  });

  res.status(200).json(successResponse(explanation, req.originalUrl));
});

export const analyzeDecision = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, question } = req.body;

  if (!dataset_id || !experiment_id || !question) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, and question are required');
  }

  const analysis = await AIService.analyzeDecisionFactors(dataset_id, experiment_id, question);
  res.status(200).json(successResponse(analysis, req.originalUrl));
});
