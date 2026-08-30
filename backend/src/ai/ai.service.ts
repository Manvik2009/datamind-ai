import { AIConfig, DEFAULT_AI_CONFIG } from './schemas/config.js';
import { AIProviderFactory } from './providers/factory.js';
import { DatasetSummaryContext, MLExplanationContext, AIInsight, AIQueryResponse, DecisionExplanationContext, DecisionAnalysisContext } from './schemas/context.js';
import { QueryResponseSchema, DecisionExplanationSchema, DecisionAnalysisSchema } from './schemas/response.js';
import {
  DATASET_SUMMARY_PROMPT,
  DATA_QUALITY_PROMPT,
  ML_EXPLANATION_PROMPT,
  INSIGHTS_PROMPT,
  QUERY_PROMPT,
  DECISION_EXPLANATION_PROMPT,
  DECISION_ANALYSIS_PROMPT,
  RECOMMENDATION_PROMPT,
  REPORT_PROMPT,
} from './prompts/templates.js';
import { DatasetService } from '../services/datasetService.js';
import { MLService } from '../services/mlService.js';
import { DecisionService } from '../services/decisionService.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

export class AIService {
  private static getConfig(): AIConfig {
    return {
      provider: (process.env.AI_PROVIDER as any) || DEFAULT_AI_CONFIG.provider,
      apiKey: process.env.AI_API_KEY || DEFAULT_AI_CONFIG.apiKey,
      model: process.env.AI_MODEL || DEFAULT_AI_CONFIG.model,
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || String(DEFAULT_AI_CONFIG.maxTokens), 10),
      temperature: parseFloat(process.env.AI_TEMPERATURE || String(DEFAULT_AI_CONFIG.temperature)),
      timeout: parseInt(process.env.AI_TIMEOUT || String(DEFAULT_AI_CONFIG.timeout), 10),
    };
  }

  private static buildPrompt(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = context[key];
      if (value === undefined || value === null) return 'N/A';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    });
  }

  private static async callProvider(prompt: string, structuredSchema?: z.ZodType<any>): Promise<any> {
    const provider = AIProviderFactory.getProvider(this.getConfig());
    if (structuredSchema) {
      return provider.generateStructured(prompt, structuredSchema, {});
    }
    return provider.generate(prompt, {});
  }

  static async generateDatasetSummary(datasetId: string): Promise<any> {
    const dataset = await DatasetService.getDatasetById(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const context: DatasetSummaryContext = {
      dataset: {
        name: dataset.original_filename,
        rows: dataset.row_count,
        columns: dataset.column_count,
        memory_bytes: dataset.profile?.memory_bytes || 0,
        duplicate_rows: dataset.profile?.duplicate_rows || 0,
        duplicate_percentage: dataset.profile?.duplicate_percentage || 0,
        missing_values: dataset.profile?.missing_values || 0,
        missing_percentage: dataset.profile?.missing_percentage || 0,
        columns_detail: dataset.profile?.columns_detail || [],
        quality_score: dataset.profile?.quality_score || 0,
        quality_breakdown: dataset.profile?.quality_breakdown || { missing_values: 0, duplicates: 0, data_types: 0, overall: 0 },
      },
      statistics: dataset.statistics,
      missing_values: dataset.missing_values,
      duplicates: dataset.duplicates,
      outliers: dataset.outliers,
      correlations: dataset.correlations,
    };

    const prompt = this.buildPrompt(DATASET_SUMMARY_PROMPT, {
      dataset_name: context.dataset.name,
      rows: context.dataset.rows,
      columns: context.dataset.columns,
      memory_mb: (context.dataset.memory_bytes / 1024 / 1024).toFixed(2),
      duplicate_rows: context.dataset.duplicate_rows,
      duplicate_percentage: context.dataset.duplicate_percentage,
      missing_values: context.dataset.missing_values,
      missing_percentage: context.dataset.missing_percentage,
      quality_score: context.dataset.quality_score,
      column_types: context.dataset.columns_detail.map((c: any) => `${c.column}: ${c.detected_type}`).join('\n'),
      missing_score: context.dataset.quality_breakdown.missing_values,
      duplicates_score: context.dataset.quality_breakdown.duplicates,
      data_types_score: context.dataset.quality_breakdown.data_types,
      top_missing_columns: context.missing_values?.columns
        .filter((c: any) => c.missing_count > 0)
        .slice(0, 5)
        .map((c: any) => `${c.column}: ${c.missing_percentage}%`)
        .join('\n') || 'None',
      correlations: context.correlations?.relationships
        .slice(0, 5)
        .map((r: any) => `${r.column_a} vs ${r.column_b}: ${r.correlation}`)
        .join('\n') || 'None found',
    });

    return this.callProvider(prompt);
  }

  static async generateDataQualityExplanation(datasetId: string): Promise<any> {
    const dataset = await DatasetService.getDatasetById(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const prompt = this.buildPrompt(DATA_QUALITY_PROMPT, {
      missing_values: dataset.missing_values
        ? `Total missing: ${dataset.missing_values.total_missing} (${dataset.missing_values.total_percentage}%)\nColumns:\n${dataset.missing_values.columns.map((c) => `- ${c.column}: ${c.missing_count} (${c.missing_percentage}%) [${c.category}]`).join('\n')}`
        : 'No missing value data available',
      duplicates: dataset.duplicates
        ? `Duplicate rows: ${dataset.duplicates.duplicate_rows} (${dataset.duplicates.duplicate_percentage}%)\nHas duplicates: ${dataset.duplicates.has_duplicates}`
        : 'No duplicate data available',
      outliers: dataset.outliers
        ? Object.entries(dataset.outliers)
            .filter((entry: [string, any]) => entry[1].outlier_count > 0)
            .map((entry: [string, any]) => `${entry[0]}: ${entry[1].outlier_count} outliers (${entry[1].outlier_percentage}%), bounds: [${entry[1].lower_bound}, ${entry[1].upper_bound}]`)
            .join('\n') || 'No significant outliers detected'
        : 'No outlier data available',
      data_types: dataset.profile?.columns_detail
        .map((c) => `${c.column}: ${c.detected_type} (raw: ${c.dtype})`)
        .join('\n') || 'No type data available',
      quality_score: dataset.profile?.quality_score || 0,
    });

    return this.callProvider(prompt);
  }

  static async explainMLResults(experimentId: string): Promise<any> {
    const experiment = await MLService.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const bestModel = experiment.models?.find((m) => m.id === experiment.best_model_id) || experiment.models?.[0];
    if (!bestModel) {
      throw new Error('No model results available');
    }

    const context: MLExplanationContext = {
      problem_type: experiment.problem_type || 'unknown',
      target_column: experiment.target_column,
      best_model: {
        model_type: bestModel.model_type,
        metrics: bestModel.metrics,
        feature_importance: bestModel.feature_importance,
      },
      comparison: (experiment.models || []).map((m) => ({
        model_type: m.model_type,
        metrics: m.metrics,
        training_time_ms: 0,
      })),
      class_distribution: undefined,
    };

    const prompt = this.buildPrompt(ML_EXPLANATION_PROMPT, {
      problem_type: context.problem_type,
      target_column: context.target_column,
      best_model: context.best_model.model_type,
      primary_metric: experiment.primary_metric || 'f1',
      primary_metric_value: JSON.stringify(context.best_model.metrics[experiment.primary_metric || 'f1'] || 'N/A'),
      comparison: context.comparison
        .map((m: any) => `${m.model_type}: ${JSON.stringify(m.metrics)}`)
        .join('\n'),
      feature_importance_section: context.best_model.feature_importance
        ? `\nFeature Importance:\n${Object.entries(context.best_model.feature_importance).map(([k, v]) => `${k}: ${(v as number).toFixed(4)}`).join('\n')}`
        : '\nFeature importance not available for this model.',
    });

    return this.callProvider(prompt);
  }

  static async generateInsights(experimentId: string): Promise<AIInsight[]> {
    const experiment = await MLService.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const prompt = this.buildPrompt(INSIGHTS_PROMPT, {
      context: JSON.stringify({
        experiment: {
          name: experiment.name,
          problem_type: experiment.problem_type,
          target_column: experiment.target_column,
          status: experiment.status,
          primary_metric: experiment.primary_metric,
          best_model_id: experiment.best_model_id,
        },
        models: experiment.models?.map((m) => ({
          type: m.model_type,
          metrics: m.metrics,
          feature_importance: m.feature_importance,
        })),
      }, null, 2),
    });

    const result = await this.callProvider(prompt, QueryResponseSchema);
    const validated = QueryResponseSchema.parse(result);
    return validated.insights?.map((i) => ({
      title: i.title || 'Insight',
      severity: i.severity || 'info',
      category: i.category || 'general',
      evidence: i.evidence || [],
      explanation: i.explanation || '',
      recommendation: i.recommendation || '',
      confidence: i.confidence || 'medium',
    })) || [];
  }

  static async queryData(datasetId: string, question: string): Promise<AIQueryResponse> {
    const dataset = await DatasetService.getDatasetById(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const availableData = {
      dataset: {
        name: dataset.original_filename,
        rows: dataset.row_count,
        columns: dataset.column_count,
        quality_score: dataset.profile?.quality_score || 0,
        column_types: dataset.profile?.columns_detail?.map((c) => ({ name: c.column, type: c.detected_type })) || [],
      },
      statistics: dataset.statistics
        ? Object.entries(dataset.statistics).slice(0, 10).map(([col, stats]: [string, any]) => ({ column: col, ...stats }))
        : [],
      correlations: dataset.correlations?.relationships?.slice(0, 10) || [],
      missing_values: dataset.missing_values?.columns?.slice(0, 10) || [],
    };

    const prompt = this.buildPrompt(QUERY_PROMPT, {
      available_data: JSON.stringify(availableData, null, 2),
      question,
    });

    const result = await this.callProvider(prompt, QueryResponseSchema);
    const validated = QueryResponseSchema.parse(result);
    return {
      answer: validated.answer || 'No answer generated.',
      insights: validated.insights || [],
      evidence: validated.evidence || [],
      limitations: validated.limitations || [],
      tools_used: validated.tools_used || [],
    };
  }

  static async explainDecision(context: DecisionExplanationContext): Promise<any> {
    const predictionDetails = {
      predicted_value: context.prediction?.value,
      target_column: context.prediction?.target_column,
    };

    const featureContributionsStr = context.feature_contributions
      ? Object.entries(context.feature_contributions)
          .sort(([, a], [, b]) => b - a)
          .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`)
          .join('\n')
      : 'Feature contributions not available';

    const inputValuesStr = context.input_data
      ? Object.entries(context.input_data)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      : 'Input values not available';

    const prompt = this.buildPrompt(DECISION_EXPLANATION_PROMPT, {
      prediction_details: JSON.stringify(predictionDetails, null, 2),
      probability: context.probability ? JSON.stringify(context.probability, null, 2) : 'Not available',
      feature_contributions: featureContributionsStr,
      input_values: inputValuesStr,
    });

    return this.callProvider(prompt, DecisionExplanationSchema);
  }

  static async analyzeDecisionFactors(datasetId: string, experimentId: string, question: string): Promise<any> {
    const experiment = await MLService.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const bestModel = experiment.models?.find((m) => m.id === experiment.best_model_id) || experiment.models?.[0];
    const featureImportance = bestModel?.feature_importance || {};

    const modelPerformance = {
      problem_type: experiment.problem_type,
      best_model_type: bestModel?.model_type,
      primary_metric: experiment.primary_metric,
      metrics: bestModel?.metrics,
    };

    const predictions = await DecisionService.getPredictions(datasetId, experimentId);
    const recentPredictions = predictions.slice(0, 10).map((p) => ({
      prediction: p.prediction,
      probability: p.probability,
    }));

    const evidence = {
      experiment: {
        name: experiment.name,
        status: experiment.status,
        target_column: experiment.target_column,
      },
      model_performance: modelPerformance,
      feature_importance: featureImportance,
      recent_predictions_summary: {
        total_predictions: predictions.length,
        sample: recentPredictions,
      },
    };

    const prompt = this.buildPrompt(DECISION_ANALYSIS_PROMPT, {
      evidence: JSON.stringify(evidence, null, 2),
      question,
      model_performance: JSON.stringify(modelPerformance, null, 2),
      feature_importance: JSON.stringify(featureImportance, null, 2),
    });

    return this.callProvider(prompt, DecisionAnalysisSchema);
  }

  static async generateRecommendations(datasetId: string, experimentId: string): Promise<any> {
    const experiment = await MLService.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const bestModel = experiment.models?.find((m) => m.id === experiment.best_model_id) || experiment.models?.[0];
    const featureImportance = bestModel?.feature_importance || {};

    const dataset = await DatasetService.getDatasetById(datasetId);

    const context = {
      dataset: dataset
        ? {
            name: dataset.original_filename,
            rows: dataset.row_count,
            columns: dataset.column_count,
            quality_score: dataset.profile?.quality_score || 0,
          }
        : null,
      experiment: {
        name: experiment.name,
        problem_type: experiment.problem_type,
        target_column: experiment.target_column,
        status: experiment.status,
      },
      model: bestModel
        ? {
            type: bestModel.model_type,
            metrics: bestModel.metrics,
          }
        : null,
    };

    const prompt = this.buildPrompt(RECOMMENDATION_PROMPT, {
      context: JSON.stringify(context, null, 2),
      decision_factors: JSON.stringify(featureImportance, null, 2),
      model_performance: JSON.stringify(bestModel?.metrics || {}, null, 2),
    });

    return this.callProvider(prompt);
  }

  static async generateReport(datasetId: string, experimentId: string): Promise<any> {
    const experiment = await MLService.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const bestModel = experiment.models?.find((m) => m.id === experiment.best_model_id) || experiment.models?.[0];
    const dataset = await DatasetService.getDatasetById(datasetId);
    const factors = await DecisionService.getDecisionFactors(experimentId);
    const predictions = await DecisionService.getPredictions(datasetId, experimentId);
    const scenarios = await DecisionService.getScenarios(datasetId, experimentId);
    const recommendations = await DecisionService.getRecommendations(datasetId, experimentId);

    const reportData = {
      dataset: dataset
        ? {
            name: dataset.original_filename,
            rows: dataset.row_count,
            columns: dataset.column_count,
            quality_score: dataset.profile?.quality_score || 0,
          }
        : null,
      model: bestModel
        ? {
            type: bestModel.model_type,
            metrics: bestModel.metrics,
            feature_importance: bestModel.feature_importance,
          }
        : null,
      decision_factors: factors.factors,
      prediction_summary: {
        total: predictions.length,
        recent: predictions.slice(0, 5).map((p) => p.prediction),
      },
      scenarios: scenarios.slice(0, 5).map((s) => ({
        name: s.scenario_name,
        baseline: s.baseline_prediction,
        scenario: s.scenario_prediction,
        difference: s.difference,
      })),
      recommendations: recommendations.slice(0, 5).map((r) => ({
        title: r.title,
        impact_area: r.impact_area,
        confidence: r.confidence,
      })),
    };

    const prompt = this.buildPrompt(REPORT_PROMPT, {
      report_data: JSON.stringify(reportData, null, 2),
    });

    return this.callProvider(prompt);
  }
}
