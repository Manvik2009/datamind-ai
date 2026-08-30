export interface DashboardSummary {
  datasets: number;
  analyses: number;
  experiments: number;
  completedExperiments: number;
  insights: number;
  predictions: number;
  reports: number;
  activeJobs: number;
}

export interface DatasetSummary {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  qualityScore: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  modelType: string;
  status: string;
  primaryMetric: string | null;
  primaryMetricValue: number | null;
  targetColumn: string;
  createdAt: string;
}

export interface InsightSummary {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  confidence: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface JobSummary {
  id: string;
  jobType: string;
  status: string;
  progress: number;
  createdAt: string;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  recentDatasets: DatasetSummary[];
  recentExperiments: ExperimentSummary[];
  recentInsights: InsightSummary[];
  recentActivity: ActivityItem[];
  activeJobs: JobSummary[];
}
