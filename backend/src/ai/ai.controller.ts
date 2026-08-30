import { Request, Response } from 'express';
import { AIService } from './ai.service.js';
import { DecisionService } from '../services/decisionService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getDatasetSummary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await AIService.generateDatasetSummary(id);
  res.status(200).json(successResponse({ dataset_id: id, summary: result }, req.originalUrl));
});

export const getDataQualityExplanation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await AIService.generateDataQualityExplanation(id);
  res.status(200).json(successResponse({ dataset_id: id, explanation: result }, req.originalUrl));
});

export const getMLExplanation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await AIService.explainMLResults(id);
  res.status(200).json(successResponse({ experiment_id: id, explanation: result }, req.originalUrl));
});

export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const insights = await AIService.generateInsights(id);
  res.status(200).json(successResponse({ experiment_id: id, insights }, req.originalUrl));
});

export const queryData = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, question } = req.body as { dataset_id: string; question: string };
  if (!dataset_id || !question) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id and question are required');
  }
  const result = await AIService.queryData(dataset_id, question);
  res.status(200).json(successResponse({ dataset_id, question, response: result }, req.originalUrl));
});

export const explainDecision = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, model_id, input_data } = req.body as {
    dataset_id: string;
    experiment_id: string;
    model_id: string;
    input_data: Record<string, unknown>;
  };

  if (!dataset_id || !experiment_id || !model_id || !input_data) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, model_id, and input_data are required');
  }

  const prediction = await DecisionService.runPrediction(dataset_id, experiment_id, model_id, input_data);

  const explanation = await AIService.explainDecision({
    prediction: prediction.prediction as { value: unknown; target_column?: string },
    probability: prediction.probability as Record<string, number> | undefined,
    feature_contributions: prediction.feature_contributions,
    input_data: prediction.input_data,
  });

  res.status(200).json(
    successResponse(
      {
        prediction_id: prediction.id,
        prediction: prediction.prediction,
        probability: prediction.probability,
        feature_contributions: prediction.feature_contributions,
        explanation,
      },
      req.originalUrl
    )
  );
});

export const analyzeDecision = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id, question } = req.body as {
    dataset_id: string;
    experiment_id: string;
    question: string;
  };

  if (!dataset_id || !experiment_id || !question) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id, experiment_id, and question are required');
  }

  const analysis = await AIService.analyzeDecisionFactors(dataset_id, experiment_id, question);
  res.status(200).json(
    successResponse(
      {
        dataset_id,
        experiment_id,
        question,
        analysis,
      },
      req.originalUrl
    )
  );
});

export const generateRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id } = req.body as {
    dataset_id: string;
    experiment_id: string;
  };

  if (!dataset_id || !experiment_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id and experiment_id are required');
  }

  const result = await AIService.generateRecommendations(dataset_id, experiment_id);

  const recommendations = result.recommendations || [];

  if (Array.isArray(recommendations)) {
    for (const rec of recommendations) {
      await DecisionService.createRecommendation(dataset_id, experiment_id, {
        title: rec.title,
        description: rec.description,
        evidence: rec.evidence || [],
        impact_area: rec.impact_area,
        confidence: rec.confidence || 'medium',
        limitations: rec.limitations || [],
      });
    }
  }

  res.status(200).json(
    successResponse(
      {
        dataset_id,
        experiment_id,
        recommendations,
        methodology: result.methodology,
      },
      req.originalUrl
    )
  );
});

export const generateDecisionReport = asyncHandler(async (req: Request, res: Response) => {
  const { dataset_id, experiment_id } = req.body as {
    dataset_id: string;
    experiment_id: string;
  };

  if (!dataset_id || !experiment_id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dataset_id and experiment_id are required');
  }

  const reportContent = await AIService.generateReport(dataset_id, experiment_id);

  const report = await DecisionService.createReport(dataset_id, experiment_id, 'full', reportContent);

  res.status(201).json(
    successResponse(
      {
        report_id: report.id,
        content: reportContent,
      },
      req.originalUrl
    )
  );
});
