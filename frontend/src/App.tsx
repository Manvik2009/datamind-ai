import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/Toast';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dashboard } from '@/pages/Dashboard';
import { Datasets } from '@/pages/Datasets';
import { Analysis } from '@/pages/Analysis';
import { Models } from '@/pages/Models';
import { Insights } from '@/pages/Insights';
import { Decisions } from '@/pages/Decisions';
import { Settings } from '@/pages/Settings';
import { useCommandPalette } from '@/hooks/useCommandPalette';

const AppLayout = () => {
  const { CommandPalette } = useCommandPalette();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Breadcrumbs />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/models" element={<Models />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/decisions" element={<Decisions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      {CommandPalette}
    </div>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppLayout />
      </ToastProvider>
    </BrowserRouter>
  );
};
