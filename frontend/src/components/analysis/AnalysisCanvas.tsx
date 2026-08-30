import { DatasetRecord } from '@/types/dataset';
import { AnalysisSession, DatasetOverview } from '@/types/analysis';
import { DatasetOverviewView } from './DatasetOverviewView';
import { ColumnExplorerView } from './ColumnExplorerView';
import { StatisticsView } from './StatisticsView';
import { DistributionView } from './DistributionView';
import { CorrelationView } from './CorrelationView';
import { OutliersView } from './OutliersView';
import { MissingDataView } from './MissingDataView';
import { ChartsView } from './ChartsView';
import { GroupByView } from './GroupByView';
import { TimeSeriesView } from './TimeSeriesView';
import { Loading } from '@/components/Loading';

type AnalysisTab = 'overview' | 'columns' | 'statistics' | 'distribution' | 'correlation' | 'outliers' | 'missing' | 'charts' | 'groupby' | 'timeseries';

interface AnalysisCanvasProps {
  activeTab: AnalysisTab;
  dataset: DatasetRecord | null;
  session: AnalysisSession | null;
  datasetOverview: DatasetOverview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const AnalysisCanvas = ({
  activeTab,
  dataset,
  datasetOverview,
  loading,
  error,
  onRetry,
}: AnalysisCanvasProps) => {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loading message="Loading analysis..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={onRetry}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Select a dataset to begin analysis.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DatasetOverviewView dataset={dataset} overview={datasetOverview} />;
      case 'columns':
        return <ColumnExplorerView dataset={dataset} />;
      case 'statistics':
        return <StatisticsView dataset={dataset} overview={datasetOverview} />;
      case 'distribution':
        return <DistributionView dataset={dataset} overview={datasetOverview} />;
      case 'correlation':
        return <CorrelationView dataset={dataset} overview={datasetOverview} />;
      case 'outliers':
        return <OutliersView dataset={dataset} overview={datasetOverview} />;
      case 'missing':
        return <MissingDataView dataset={dataset} />;
      case 'charts':
        return <ChartsView dataset={dataset} overview={datasetOverview} />;
      case 'groupby':
        return <GroupByView dataset={dataset} overview={datasetOverview} />;
      case 'timeseries':
        return <TimeSeriesView dataset={dataset} overview={datasetOverview} />;
      default:
        return <DatasetOverviewView dataset={dataset} overview={datasetOverview} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {renderContent()}
    </div>
  );
};
