import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  href: string;
}

interface SearchResults {
  datasets: SearchResultItem[];
  analyses: SearchResultItem[];
  models: SearchResultItem[];
  reports: SearchResultItem[];
}

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [datasetsRes, experimentsRes] = await Promise.all([
          apiClient.get<any[]>('/datasets'),
          apiClient.get<any[]>('/ml'),
        ]);

        const datasets: SearchResultItem[] = (datasetsRes || [])
          .filter((d) => d.original_filename?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((d) => ({
            id: d.id,
            title: d.original_filename,
            subtitle: `${d.row_count} rows`,
            type: 'dataset',
            href: `/datasets`,
          }));

        const models: SearchResultItem[] = (experimentsRes || [])
          .filter((m) => m.name?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((m) => ({
            id: m.id,
            title: m.name,
            subtitle: m.status,
            type: 'model',
            href: `/models`,
          }));

        setSearchResults({ datasets, analyses: [], models, reports: [] });
        setShowResults(true);
      } catch {
        setSearchResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleResultClick = (href: string) => {
    navigate(href);
    setShowResults(false);
    setSearchQuery('');
  };

  const totalResults = searchResults
    ? searchResults.datasets.length + searchResults.models.length
    : 0;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">DataMind AI</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={searchRef}>
          <div className="relative hidden md:block">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Search datasets, models... (Ctrl+K)"
              className="w-72 rounded-lg border border-border bg-secondary py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {showResults && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : totalResults === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              ) : (
                <div className="max-h-80 overflow-y-auto p-2">
                  {searchResults?.datasets && searchResults.datasets.length > 0 && (
                    <div className="mb-2">
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Datasets</p>
                      {searchResults.datasets.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item.href)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                        >
                          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                          <div>
                            <p className="text-sm text-foreground">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults?.models && searchResults.models.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Models</p>
                      {searchResults.models.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item.href)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                        >
                          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm text-foreground">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">U</span>
          </div>
          <span className="hidden text-sm text-foreground md:block">User</span>
        </div>
      </div>
    </header>
  );
};
