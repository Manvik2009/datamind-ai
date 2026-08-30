import { DatasetOverview } from '@/types/analysis';

type AnalysisTab = 'overview' | 'columns' | 'statistics' | 'distribution' | 'correlation' | 'outliers' | 'missing' | 'charts' | 'groupby' | 'timeseries';

interface AnalysisToolsPanelProps {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
  datasetOverview: DatasetOverview | null;
}

const tabs: Array<{ id: AnalysisTab; label: string; group: string }> = [
  { id: 'overview', label: 'Overview', group: 'Data' },
  { id: 'columns', label: 'Columns', group: 'Data' },
  { id: 'missing', label: 'Missing Data', group: 'Data' },
  { id: 'statistics', label: 'Statistics', group: 'Analysis' },
  { id: 'distribution', label: 'Distribution', group: 'Analysis' },
  { id: 'correlation', label: 'Correlation', group: 'Analysis' },
  { id: 'outliers', label: 'Outliers', group: 'Analysis' },
  { id: 'charts', label: 'Charts', group: 'Visualize' },
  { id: 'groupby', label: 'Group By', group: 'Visualize' },
  { id: 'timeseries', label: 'Time Series', group: 'Visualize' },
];

export const AnalysisToolsPanel = ({ activeTab, onTabChange }: AnalysisToolsPanelProps) => {
  let lastGroup = '';

  return (
    <div className="w-56 flex-shrink-0 overflow-y-auto border-r border-border bg-card">
      <div className="p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Analysis Tools</h3>
        <nav className="space-y-0.5">
          {tabs.map((tab) => {
            const showGroup = tab.group !== lastGroup;
            lastGroup = tab.group;
            return (
              <div key={tab.id}>
                {showGroup && (
                  <div className="mt-3 first:mt-0">
                    <span className="px-2 text-xs font-medium text-muted-foreground">{tab.group}</span>
                  </div>
                )}
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
