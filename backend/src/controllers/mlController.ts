import { Request, Response } from 'express';
import { MLService } from '../services/mlService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const createExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, name, target_column, problem_type, test_size, random_seed, selected_features, selected_models } = req.body;

  if (!dataset_id || !name || !target_column) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, name, and target_column are required');
  }

  const experiment = await MLService.createExperiment(dataset_id, {
    name,
    target_column,
    problem_type,
    test_size: test_size || 0.2,
    random_seed: random_seed || 42,
    selected_features,
    selected_models,
  });

  res.status(201).json(successResponse(experiment, req.originalUrl));
});

export const getExperiments = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id } = req.query;
  const experiments = await MLService.getExperiments(dataset_id as string | undefined);
  res.status(200).json(successResponse(experiments, req.originalUrl));
});

export const getExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const experiment = await MLService.getExperiment(id);
  if (!experiment) {
    throw new AppError(404, 'NOT_FOUND', 'Experiment not found');
  }
  res.status(200).json(successResponse(experiment, req.originalUrl));
});

export const deleteExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const deleted = await MLService.deleteExperiment(id);
  if (!deleted) {
    throw new AppError(404, 'NOT_FOUND', 'Experiment not found');
  }
  res.status(200).json(successResponse({ id, deleted: true }, req.originalUrl));
});

export const trainExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const experiment = await MLService.getExperiment(id);
  if (!experiment) {
    throw new AppError(404, 'NOT_FOUND', 'Experiment not found');
  }

  if (experiment.status !== 'QUEUED') {
    throw new AppError(400, 'INVALID_STATE', `Cannot train experiment in ${experiment.status} state`);
  }

  res.status(202).json(successResponse({ id, status: 'RUNNING', message: 'Training started' }, req.originalUrl));

  MLService.runTraining(id).catch((error) => {
    logger.error('Background training failed', { experimentId: id, error });
  });
});

export const predictExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const experiment = await MLService.getExperiment(id);
  if (!experiment) {
    throw new AppError(404, 'NOT_FOUND', 'Experiment not found');
  }

  if (experiment.status !== 'COMPLETED') {
    throw new AppError(400, 'INVALID_STATE', 'Experiment has not completed training');
  }

  throw new AppError(501, 'NOT_IMPLEMENTED', 'Prediction endpoint not yet implemented');
});
