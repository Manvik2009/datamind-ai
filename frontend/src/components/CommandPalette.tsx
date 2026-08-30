import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
}

export const CommandPalette = ({ onClose }: { onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    {
      id: 'upload-dataset',
      label: 'Upload Dataset',
      description: 'Import a new dataset',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
      action: () => { navigate('/datasets'); onClose(); },
    },
    {
      id: 'start-analysis',
      label: 'Start Analysis',
      description: 'Analyze a dataset',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      action: () => { navigate('/analysis'); onClose(); },
    },
    {
      id: 'train-model',
      label: 'Train Model',
      description: 'Start ML experiment',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      action: () => { navigate('/models'); onClose(); },
    },
    {
      id: 'ask-ai',
      label: 'Ask AI',
      description: 'Query the AI Analyst',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      action: () => { navigate('/insights'); onClose(); },
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      description: 'See generated reports',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      action: () => { navigate('/decisions'); onClose(); },
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Configure your preferences',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      action: () => { navigate('/settings'); onClose(); },
    },
  ];

  const filtered = query
    ? commands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No commands found</p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-secondary transition-colors"
              >
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cmd.icon} />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                  {cmd.description && <p className="text-xs text-muted-foreground">{cmd.description}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
