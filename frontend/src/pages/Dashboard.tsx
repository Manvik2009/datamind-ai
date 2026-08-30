import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { DashboardOverview } from '@/types/dashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { DatasetCard } from '@/components/dashboard/DatasetCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { JobStatusCard } from '@/components/dashboard/JobStatusCard';
import { ModelPerformanceCard } from '@/components/dashboard/ModelPerformanceCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { Loading } from '@/components/Loading';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboardOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const { summary, recentDatasets, recentExperiments, recentInsights, recentActivity, activeJobs } = overview;
  const hasAnyData = summary.datasets > 0 || summary.experiments > 0 || summary.insights > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Your DataMind workspace at a glance</p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          title="Welcome to DataMind AI"
          description="Your workspace is ready. Upload your first dataset to begin exploring, analyzing, and modeling your data."
          action={{
            label: 'Upload Dataset',
            onClick: () => navigate('/datasets'),
          }}
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Datasets"
              value={summary.datasets}
              subtitle="Total datasets"
              loading={loading}
              onClick={() => navigate('/datasets')}
            />
            <StatCard
              title="Experiments"
              value={summary.experiments}
              subtitle={`${summary.completedExperiments} completed`}
              loading={loading}
              onClick={() => navigate('/models')}
            />
            <StatCard
              title="AI Insights"
              value={summary.insights}
              subtitle="Generated insights"
              loading={loading}
            />
            <StatCard
              title="Predictions"
              value={summary.predictions.toLocaleString()}
              subtitle="Total predictions"
              loading={loading}
              onClick={() => navigate('/decisions')}
            />
          </div>

          {recentDatasets.length > 0 && (
            <section>
              <SectionHeader
                title="Recent Datasets"
                action={
                  <button
                    onClick={() => navigate('/datasets')}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    View all →
                  </button>
                }
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentDatasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onClick={() => navigate(`/datasets/${dataset.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {recentExperiments.length > 0 && (
            <section>
              <SectionHeader
                title="ML Model Performance"
                action={
                  <button
                    onClick={() => navigate('/models')}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    View all →
                  </button>
                }
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentExperiments.map((experiment) => (
                  <ModelPerformanceCard
                    key={experiment.id}
                    experiment={experiment}
                    onClick={() => navigate(`/models/${experiment.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {recentInsights.length > 0 && (
            <section>
              <SectionHeader title="AI Insights" description="Recent insights from your analyses" />
              <div className="space-y-3">
                {recentInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {activeJobs.length > 0 && (
            <section>
              <SectionHeader title="Active Jobs" description="Currently running operations" />
              <div className="grid gap-3 sm:grid-cols-2">
                {activeJobs.map((job) => (
                  <JobStatusCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {recentActivity.length > 0 && (
            <section>
              <SectionHeader title="Recent Activity" description="Your latest workspace activity" />
              <ActivityFeed activities={recentActivity} />
            </section>
          )}
        </>
      )}
    </div>
  );
};
