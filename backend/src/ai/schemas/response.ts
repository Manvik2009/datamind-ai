import { z } from 'zod';

export const InsightSchema = z.object({
  title: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  category: z.string(),
  evidence: z.array(z.string()),
  explanation: z.string(),
  recommendation: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export const QueryResponseSchema = z.object({
  answer: z.string(),
  insights: z.array(InsightSchema),
  evidence: z.array(z.string()),
  limitations: z.array(z.string()),
  tools_used: z.array(z.string()),
});

export const DatasetSummarySchema = z.object({
  summary: z.string(),
  key_characteristics: z.array(z.string()),
  quality_observations: z.array(z.string()),
  statistical_patterns: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const DataQualityExplanationSchema = z.object({
  detected_issues: z.array(z.string()),
  potential_issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  overall_assessment: z.string(),
});

export const MLExplanationSchema = z.object({
  explanation: z.string(),
  model_comparison: z.string(),
  feature_interpretation: z.string(),
  limitations: z.array(z.string()),
});

export const DecisionExplanationSchema = z.object({
  explanation: z.string(),
  key_factors: z.array(z.string()),
  confidence_assessment: z.string(),
  limitations: z.array(z.string()),
  disclaimers: z.array(z.string()),
});

export const DecisionAnalysisSchema = z.object({
  analysis: z.string(),
  key_findings: z.array(z.string()),
  recommended_areas_to_investigate: z.array(z.string()),
  potential_scenarios: z.array(z.string()),
  evidence_citations: z.array(z.string()),
  limitations: z.array(z.string()),
  disclaimers: z.array(z.string()),
});

export const RecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      evidence: z.array(z.string()),
      impact_area: z.string(),
      confidence: z.enum(['low', 'medium', 'high']),
      limitations: z.array(z.string()),
    })
  ),
  methodology: z.string(),
});

export const ReportOutputSchema = z.object({
  executive_summary: z.string(),
  dataset_overview: z.string(),
  model_used: z.string(),
  model_performance: z.string(),
  key_findings: z.array(z.string()),
  important_features: z.array(z.string()),
  scenario_analysis: z.string(),
  recommendations: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type Insight = z.infer<typeof InsightSchema>;
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
export type DatasetSummary = z.infer<typeof DatasetSummarySchema>;
export type DataQualityExplanation = z.infer<typeof DataQualityExplanationSchema>;
export type MLExplanation = z.infer<typeof MLExplanationSchema>;
export type DecisionExplanation = z.infer<typeof DecisionExplanationSchema>;
export type DecisionAnalysis = z.infer<typeof DecisionAnalysisSchema>;
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;
export type ReportOutput = z.infer<typeof ReportOutputSchema>;
