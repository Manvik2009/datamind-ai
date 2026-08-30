import { useState } from 'react';
import { DatasetDetail } from '@/types/dataset';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface DatasetDetailProps {
  dataset: DatasetDetail;
}

type Tab = 'overview' | 'columns' | 'missing' | 'statistics' | 'duplicates' | 'outliers' | 'correlations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const DatasetDetailView = ({ dataset }: DatasetDetailProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'columns', label: 'Columns' },
    { id: 'missing', label: 'Missing Values' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'duplicates', label: 'Duplicates' },
    { id: 'outliers', label: 'Outliers' },
    { id: 'correlations', label: 'Correlations' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{dataset.original_filename}</h3>
          <p className="text-sm text-muted-foreground">
            {dataset.row_count.toLocaleString()} rows × {dataset.column_count} columns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Quality: {dataset.profile?.quality_score ?? 'N/A'}/100
          </span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {activeTab === 'overview' && <OverviewTab dataset={dataset} />}
        {activeTab === 'columns' && <ColumnsTab dataset={dataset} />}
        {activeTab === 'missing' && <MissingTab dataset={dataset} />}
        {activeTab === 'statistics' && <StatisticsTab dataset={dataset} />}
        {activeTab === 'duplicates' && <DuplicatesTab dataset={dataset} />}
        {activeTab === 'outliers' && <OutliersTab dataset={dataset} />}
        {activeTab === 'correlations' && <CorrelationsTab dataset={dataset} />}
      </div>
    </div>
  );
};

const OverviewTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const profile = dataset.profile;
  const qualityScore = profile?.quality_score ?? 0;
  const breakdown = profile?.quality_breakdown;

  const qualityData = breakdown
    ? [
        { name: 'Missing Values', score: breakdown.missing_values },
        { name: 'Duplicates', score: breakdown.duplicates },
        { name: 'Data Types', score: breakdown.data_types },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Rows" value={profile?.rows.toLocaleString() ?? 'N/A'} />
        <StatCard label="Columns" value={profile?.columns.toLocaleString() ?? 'N/A'} />
        <StatCard label="Missing Values" value={profile?.missing_values.toLocaleString() ?? 'N/A'} />
        <StatCard label="Duplicates" value={profile?.duplicate_rows.toLocaleString() ?? 'N/A'} />
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 text-sm font-medium text-foreground">Quality Score</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${qualityScore}%`,
                  backgroundColor: qualityScore >= 80 ? '#10b981' : qualityScore >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
          <span className="text-lg font-semibold text-foreground">{qualityScore}/100</span>
        </div>
      </div>

      {qualityData.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Quality Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={qualityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {qualityData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const ColumnsTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const columns = dataset.profile?.columns_detail ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 font-medium text-muted-foreground">Column</th>
            <th className="pb-2 font-medium text-muted-foreground">Type</th>
            <th className="pb-2 font-medium text-muted-foreground">Detected</th>
            <th className="pb-2 font-medium text-muted-foreground">Missing</th>
            <th className="pb-2 font-medium text-muted-foreground">Unique</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {columns.map((col) => (
            <tr key={col.column}>
              <td className="py-2 font-mono text-foreground">{col.column}</td>
              <td className="py-2 text-muted-foreground">{col.dtype}</td>
              <td className="py-2 text-muted-foreground">{col.detected_type}</td>
              <td className="py-2 text-muted-foreground">{col.missing_percentage}%</td>
              <td className="py-2 text-muted-foreground">{col.unique_values.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MissingTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const columns = dataset.missing_values?.columns ?? [];

  const chartData = columns
    .filter((col) => col.missing_count > 0)
    .map((col) => ({
      name: col.column,
      missing: col.missing_count,
      percentage: col.missing_percentage,
    }))
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 10);

  const pieData = [
    { name: 'Complete', value: dataset.row_count * (dataset.column_count - columns.length) - (dataset.missing_values?.total_missing ?? 0) + columns.filter((c) => c.missing_count === 0).length * dataset.row_count },
    { name: 'Missing', value: dataset.missing_values?.total_missing ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Missing" value={dataset.missing_values?.total_missing.toLocaleString() ?? 'N/A'} />
        <StatCard label="Missing %" value={`${dataset.missing_values?.total_percentage ?? 'N/A'}%`} />
        <StatCard label="Columns" value={columns.length.toLocaleString()} />
      </div>

      {chartData.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Missing Values by Column (Top 10)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="missing" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Missing vs Complete</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Category Distribution</h4>
          <div className="space-y-2">
            {['complete', 'low_missingness', 'moderate_missingness', 'high_missingness'].map((category) => {
              const count = columns.filter((c) => c.category === category).length;
              const percentage = columns.length > 0 ? (count / columns.length) * 100 : 0;
              return (
                <div key={category} className="flex items-center gap-2">
                  <span className="w-32 text-xs text-muted-foreground capitalize">{category.replace(/_/g, ' ')}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category === 'complete' ? '#10b981' : category === 'low_missingness' ? '#f59e0b' : category === 'moderate_missingness' ? '#f97316' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 font-medium text-muted-foreground">Column</th>
              <th className="pb-2 font-medium text-muted-foreground">Missing</th>
              <th className="pb-2 font-medium text-muted-foreground">Percentage</th>
              <th className="pb-2 font-medium text-muted-foreground">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {columns.map((col) => (
              <tr key={col.column}>
                <td className="py-2 font-mono text-foreground">{col.column}</td>
                <td className="py-2 text-muted-foreground">{col.missing_count.toLocaleString()}</td>
                <td className="py-2 text-muted-foreground">{col.missing_percentage}%</td>
                <td className="py-2">
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    {col.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatisticsTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const stats = dataset.statistics ?? {};

  const numericColumns = Object.entries(stats)
    .filter(([, s]) => s.type === 'numeric')
    .map(([col, s]) => {
      const stat = s as { type: 'numeric'; mean: number | null; std: number | null; min: number | null; max: number | null };
      return {
        name: col,
        mean: stat.mean ?? 0,
        std: stat.std ?? 0,
        min: stat.min ?? 0,
        max: stat.max ?? 0,
      };
    })
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {numericColumns.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Numeric Column Means</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={numericColumns}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="mean" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 font-medium text-muted-foreground">Column</th>
              <th className="pb-2 font-medium text-muted-foreground">Type</th>
              <th className="pb-2 font-medium text-muted-foreground">Count</th>
              <th className="pb-2 font-medium text-muted-foreground">Mean / Top</th>
              <th className="pb-2 font-medium text-muted-foreground">Std / Unique</th>
              <th className="pb-2 font-medium text-muted-foreground">Min / Freq</th>
              <th className="pb-2 font-medium text-muted-foreground">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Object.entries(stats).map(([col, s]) => {
              const stat = s as any;
              return (
                <tr key={col}>
                  <td className="py-2 font-mono text-foreground">{col}</td>
                  <td className="py-2 text-muted-foreground">{stat.type}</td>
                  <td className="py-2 text-muted-foreground">{stat.count.toLocaleString()}</td>
                  <td className="py-2 text-muted-foreground">
                    {stat.type === 'numeric' ? (stat.mean?.toFixed(2) ?? 'N/A') : (stat.most_frequent ?? 'N/A')}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {stat.type === 'numeric' ? (stat.std?.toFixed(2) ?? 'N/A') : stat.unique_count?.toLocaleString()}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {stat.type === 'numeric' ? (stat.min?.toFixed(2) ?? 'N/A') : (stat.most_frequent_count?.toLocaleString() ?? 'N/A')}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {stat.type === 'numeric' ? (stat.max?.toFixed(2) ?? 'N/A') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DuplicatesTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const dupes = dataset.duplicates;
  const duplicateRows = dupes?.duplicate_rows ?? 0;
  const uniqueRows = (dataset.row_count ?? 0) - duplicateRows;

  const pieData = [
    { name: 'Unique', value: Math.max(0, uniqueRows) },
    { name: 'Duplicate', value: duplicateRows },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Duplicate Rows" value={dupes?.duplicate_rows.toLocaleString() ?? 'N/A'} />
        <StatCard label="Percentage" value={`${dupes?.duplicate_percentage ?? 'N/A'}%`} />
        <StatCard label="Has Duplicates" value={dupes?.has_duplicates ? 'Yes' : 'No'} />
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 text-sm font-medium text-foreground">Unique vs Duplicate Rows</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const OutliersTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const outliers = dataset.outliers ?? {};
  const entries = Object.entries(outliers).filter(([, v]) => (v as any).outlier_count > 0);

  const chartData = entries
    .map(([col, v]) => {
      const data = v as any;
      return {
        name: col,
        outliers: data.outlier_count,
        percentage: data.outlier_percentage,
      };
    })
    .sort((a, b) => b.outliers - a.outliers)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{entries.length} columns with outliers detected</p>

      {chartData.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Outliers by Column (Top 10)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="outliers" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 font-medium text-muted-foreground">Column</th>
              <th className="pb-2 font-medium text-muted-foreground">Outliers</th>
              <th className="pb-2 font-medium text-muted-foreground">Percentage</th>
              <th className="pb-2 font-medium text-muted-foreground">Lower Bound</th>
              <th className="pb-2 font-medium text-muted-foreground">Upper Bound</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map(([col, v]) => {
              const data = v as any;
              return (
                <tr key={col}>
                  <td className="py-2 font-mono text-foreground">{col}</td>
                  <td className="py-2 text-muted-foreground">{data.outlier_count.toLocaleString()}</td>
                  <td className="py-2 text-muted-foreground">{data.outlier_percentage}%</td>
                  <td className="py-2 text-muted-foreground">{data.lower_bound?.toFixed(2) ?? 'N/A'}</td>
                  <td className="py-2 text-muted-foreground">{data.upper_bound?.toFixed(2) ?? 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CorrelationsTab = ({ dataset }: { dataset: DatasetDetail }) => {
  const relationships = dataset.correlations?.relationships ?? [];
  const matrix = dataset.correlations?.matrix ?? {};

  const heatmapData: Array<{ colA: string; colB: string; value: number }> = [];
  const cols = Object.keys(matrix);
  for (const colA of cols) {
    for (const colB of cols) {
      if (colA !== colB && matrix[colA]?.[colB] !== undefined) {
        heatmapData.push({ colA, colB, value: matrix[colA][colB] });
      }
    }
  }

  const chartData = relationships
    .map((rel) => ({
      name: `${rel.column_a} vs ${rel.column_b}`,
      correlation: rel.correlation,
    }))
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{relationships.length} relationships found</p>

      {chartData.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Top Correlations</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.correlation > 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {cols.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Correlation Heatmap</h4>
          <div className="overflow-x-auto">
            <table className="text-left text-xs">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {cols.map((col) => (
                    <th key={col} className="p-1 font-medium text-muted-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cols.map((colA) => (
                  <tr key={colA}>
                    <td className="p-1 font-medium text-muted-foreground">{colA}</td>
                    {cols.map((colB) => {
                      const value = matrix[colA]?.[colB] ?? 0;
                      const absValue = Math.abs(value);
                      const bgColor =
                        colA === colB
                          ? 'hsl(var(--secondary))'
                          : value > 0
                          ? `rgba(16, 185, 129, ${absValue * 0.8})`
                          : value < 0
                          ? `rgba(239, 68, 68, ${absValue * 0.8})`
                          : 'transparent';
                      return (
                        <td
                          key={colB}
                          className="p-1 text-center"
                          style={{ backgroundColor: bgColor }}
                        >
                          {colA === colB ? '-' : value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 font-medium text-muted-foreground">Column A</th>
              <th className="pb-2 font-medium text-muted-foreground">Column B</th>
              <th className="pb-2 font-medium text-muted-foreground">Correlation</th>
              <th className="pb-2 font-medium text-muted-foreground">Relationship</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {relationships.map((rel) => (
              <tr key={`${rel.column_a}-${rel.column_b}`}>
                <td className="py-2 font-mono text-foreground">{rel.column_a}</td>
                <td className="py-2 font-mono text-foreground">{rel.column_b}</td>
                <td className="py-2 text-muted-foreground">{rel.correlation.toFixed(4)}</td>
                <td className="py-2">
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    {rel.relationship.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
  </div>
);
