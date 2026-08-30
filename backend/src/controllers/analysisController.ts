import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysisService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';

function getStringParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function getParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return '';
}

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, title } = req.body;
  if (!dataset_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id is required');
  }

  const userId = req.user?.id;
  const session = await AnalysisService.createSession(dataset_id, userId, title);
  res.status(201).json(successResponse(session, req.originalUrl));
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const sessions = await AnalysisService.getSessions(userId);
  res.status(200).json(successResponse(sessions, req.originalUrl));
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const session = await AnalysisService.getSession(id);
  if (!session) {
    throw new AppError(404, 'NOT_FOUND', 'Analysis session not found');
  }
  res.status(200).json(successResponse(session, req.originalUrl));
});

export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const { title, description, status } = req.body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;

  const session = await AnalysisService.updateSession(id, updates);
  res.status(200).json(successResponse(session, req.originalUrl));
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  await AnalysisService.deleteSession(id);
  res.status(200).json(successResponse({ deleted: true }, req.originalUrl));
});

export const duplicateSession = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const userId = req.user?.id;
  const newSession = await AnalysisService.duplicateSession(id, userId);
  res.status(201).json(successResponse(newSession, req.originalUrl));
});

export const getDatasetOverview = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const overview = await AnalysisService.getDatasetOverview(datasetId);
  res.status(200).json(successResponse(overview, req.originalUrl));
});

export const exploreColumn = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const columnName = getParam(req.params.columnName);
  const exploration = await AnalysisService.exploreColumn(datasetId, columnName);
  res.status(200).json(successResponse(exploration, req.originalUrl));
});

export const getDescriptiveStatistics = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const column = getStringParam(req.query.column);
  if (!column) {
    throw new AppError(400, 'VALIDATION_ERROR', 'column query parameter is required');
  }

  const statistics = await AnalysisService.getDescriptiveStatistics(datasetId, column);
  res.status(200).json(successResponse(statistics, req.originalUrl));
});

export const getDistributionAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const column = getStringParam(req.query.column);
  if (!column) {
    throw new AppError(400, 'VALIDATION_ERROR', 'column query parameter is required');
  }

  const binsParam = getStringParam(req.query.bins);
  const numBins = binsParam ? parseInt(binsParam, 10) : undefined;
  const distribution = await AnalysisService.getDistributionAnalysis(datasetId, column, numBins);
  res.status(200).json(successResponse(distribution, req.originalUrl));
});

export const getCorrelation = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const columnA = getStringParam(req.query.column_a);
  const columnB = getStringParam(req.query.column_b);
  if (!columnA || !columnB) {
    throw new AppError(400, 'VALIDATION_ERROR', 'column_a and column_b query parameters are required');
  }

  const methodParam = getStringParam(req.query.method);
  const correlationMethod = (methodParam as 'pearson' | 'spearman') || 'pearson';
  const correlation = await AnalysisService.getCorrelation(datasetId, columnA, columnB, correlationMethod);
  res.status(200).json(successResponse(correlation, req.originalUrl));
});

export const getCorrelationMatrix = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const methodParam = getStringParam(req.query.method);
  const correlationMethod = (methodParam as 'pearson' | 'spearman') || 'pearson';
  const matrix = await AnalysisService.getCorrelationMatrix(datasetId, correlationMethod);
  res.status(200).json(successResponse(matrix, req.originalUrl));
});

export const analyzeOutliers = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const column = getStringParam(req.query.column);
  if (!column) {
    throw new AppError(400, 'VALIDATION_ERROR', 'column query parameter is required');
  }

  const methodParam = getStringParam(req.query.method);
  const outlierMethod = (methodParam as 'IQR' | 'ZSCORE') || 'IQR';
  const outliers = await AnalysisService.analyzeOutliers(datasetId, column, outlierMethod);
  res.status(200).json(successResponse(outliers, req.originalUrl));
});

export const analyzeMissingData = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const missingData = await AnalysisService.analyzeMissingData(datasetId);
  res.status(200).json(successResponse(missingData, req.originalUrl));
});

export const groupByAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const { group_by, measure, aggregation } = req.body;
  if (!group_by || !measure || !aggregation) {
    throw new AppError(400, 'VALIDATION_ERROR', 'group_by, measure, and aggregation are required');
  }

  const result = await AnalysisService.groupByAnalysis(datasetId, group_by, measure, aggregation);
  res.status(200).json(successResponse(result, req.originalUrl));
});

export const timeSeriesAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const { date_column, value_column, frequency, aggregation } = req.body;
  if (!date_column || !value_column || !frequency || !aggregation) {
    throw new AppError(400, 'VALIDATION_ERROR', 'date_column, value_column, frequency, and aggregation are required');
  }

  const result = await AnalysisService.timeSeriesAnalysis(datasetId, date_column, value_column, frequency, aggregation);
  res.status(200).json(successResponse(result, req.originalUrl));
});

export const generateChart = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const config = req.body;
  if (!config.chart_type || !config.x_axis) {
    throw new AppError(400, 'VALIDATION_ERROR', 'chart_type and x_axis are required');
  }

  const result = await AnalysisService.generateChart(datasetId, config);
  res.status(200).json(successResponse(result, req.originalUrl));
});

export const runStatisticalTest = asyncHandler(async (req: Request, res: Response) => {
  const datasetId = getParam(req.params.datasetId);
  const { test_type, column_a, column_b } = req.body;
  if (!test_type || !column_a) {
    throw new AppError(400, 'VALIDATION_ERROR', 'test_type and column_a are required');
  }

  const result = await AnalysisService.runStatisticalTest(datasetId, test_type, column_a, column_b);
  res.status(200).json(successResponse(result, req.originalUrl));
});

export const exportAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const formatParam = getStringParam(req.query.format);
  const exportFormat = formatParam || 'json';

  const result = await AnalysisService.exportAnalysis(id, exportFormat);
  res.status(200).json(successResponse(result, req.originalUrl));
});

export const getAnalysisHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const sessions = await AnalysisService.getSessions(userId);
  res.status(200).json(successResponse(sessions, req.originalUrl));
});
