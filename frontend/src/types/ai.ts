export interface AIInsight {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  evidence: string[];
  explanation: string;
  recommendation: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AIQueryResponse {
  answer: string;
  insights: AIInsight[];
  evidence: string[];
  limitations: string[];
  tools_used: string[];
}

export interface AIDatasetSummary {
  summary: string;
  key_characteristics: string[];
  quality_observations: string[];
  statistical_patterns: string[];
  limitations: string[];
}

export interface AIDataQualityExplanation {
  detected_issues: string[];
  potential_issues: string[];
  recommendations: string[];
  overall_assessment: string;
}

export interface AIMLExplanation {
  explanation: string;
  model_comparison: string;
  feature_interpretation: string;
  limitations: string[];
}

export interface AIMLExplanation {
  explanation: string;
  model_comparison: string;
  feature_interpretation: string;
  limitations: string[];
}
